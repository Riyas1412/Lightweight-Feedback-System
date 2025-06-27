from fastapi import FastAPI, HTTPException, Depends, Request, Body
from fastapi.middleware.cors import CORSMiddleware
from pymongo import MongoClient
from dotenv import load_dotenv
import os
import firebase_admin
from firebase_admin import auth, credentials
from datetime import datetime
from bson import ObjectId

# Load environment variables
load_dotenv()

# Initialize Firebase
cred = credentials.Certificate("firebase-adminsdk.json")
firebase_admin.initialize_app(cred)

# Initialize MongoDB
client = MongoClient(os.getenv("MONGO_URI"))
db = client["feedback_app"]

# Initialize FastAPI
app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Authentication middleware
async def verify_token(request: Request):
    auth_header = request.headers.get("Authorization")
    if not auth_header:
        raise HTTPException(status_code=401, detail="Authorization header missing")
    
    try:
        scheme, token = auth_header.split()
        if scheme.lower() != "bearer":
            raise HTTPException(status_code=401, detail="Invalid authorization scheme")
        
        return auth.verify_id_token(token)
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

# User registration
@app.post("/api/register")
async def register_user(data: dict = Body(...)):
    required_fields = ["uid", "name", "email", "role"]
    if not all(k in data for k in required_fields):
        raise HTTPException(status_code=400, detail="Missing required user data")
    
    if db.users.find_one({"uid": data["uid"]}):
        raise HTTPException(status_code=409, detail="User already registered")
    
    user_doc = {
        "uid": data["uid"],
        "name": data["name"],
        "email": data["email"],
        "role": data["role"]
    }
    
    if data["role"] == "employee":
        if not data.get("manager"):
            raise HTTPException(status_code=400, detail="Employee must specify a manager")
        user_doc["manager"] = data["manager"]
    
    db.users.insert_one(user_doc)
    return {"status": "success", "message": "User registered"}

# Get managers list
@app.get("/api/managers")
async def list_managers():
    managers = db.users.find(
        {"role": "manager"},
        {"_id": 0, "uid": 1, "name": 1}
    )
    return list(managers)

# User profile
@app.get("/profile")
async def get_profile(user=Depends(verify_token)):
    user_data = db.users.find_one({"uid": user["uid"]}, {"_id": 0})
    
    if not user_data:
        new_user = {
            "uid": user["uid"],
            "name": user.get("name", "Unknown"),
            "email": user.get("email", ""),
            "role": "employee",
            "joined": str(datetime.today().date())
        }
        db.users.insert_one(new_user)
        return new_user
    
    return user_data

# Get user feedbacks
@app.get("/feedbacks")
async def get_feedbacks(user=Depends(verify_token)):
    feedbacks = []
    for f in db.feedbacks.find({"to": user["uid"]}):
        from_user = db.users.find_one({"uid": f["from"]}, {"name": 1})
        f["_id"] = str(f["_id"])
        f["fromName"] = from_user["name"] if from_user else f["from"]
        feedbacks.append(f)
    
    return feedbacks

# Submit feedback
@app.post("/feedback")
async def post_feedback(data: dict = Body(...), user=Depends(verify_token)):
    required_fields = ["to", "strengths", "improvements", "sentiment"]
    if not all(k in data for k in required_fields):
        raise HTTPException(status_code=400, detail="Missing feedback fields")
    
    feedback = {
        "from": user["uid"],
        "to": data["to"],
        "strengths": data["strengths"],
        "improvements": data["improvements"],
        "sentiment": data["sentiment"],
        "date": data.get("date") or str(datetime.today().date())
    }
    db.feedbacks.insert_one(feedback)
    return {"status": "success"}

# Root endpoint
@app.get("/")
def read_root():
    return {"message": "Welcome to the Feedback System API"}

# Get user by UID
@app.get("/api/user/{uid}")
async def get_user_by_uid(uid: str, user=Depends(verify_token)):
    user_data = db.users.find_one({"uid": uid}, {"_id": 0})
    if not user_data:
        raise HTTPException(status_code=404, detail="User not found")
    return user_data

# Get manager's employees
@app.get("/employees")
async def get_employees(user=Depends(verify_token)):
    db_user = db.users.find_one({"uid": user["uid"]})
    if not db_user or db_user.get("role") != "manager":
        raise HTTPException(status_code=403, detail="Only managers can access employee list")
    
    employees = db.users.find(
        {"role": "employee", "manager": user["uid"]},
        {"_id": 0, "uid": 1, "name": 1, "designation": 1}
    )
    return list(employees)

# Get feedbacks by manager
@app.get("/api/feedbacks/from/{uid}")
async def get_feedbacks_by_manager(uid: str, user=Depends(verify_token)):
    db_user = db.users.find_one({"uid": user["uid"]})
    if not db_user or db_user.get("role") != "manager":
        raise HTTPException(status_code=403, detail="Only managers can view this data")
    
    feedbacks = []
    for f in db.feedbacks.find({"from": uid}):
        f["_id"] = str(f["_id"])
        to_user = db.users.find_one({"uid": f["to"]}, {"name": 1})
        f["toName"] = to_user["name"] if to_user else f["to"]
        
        # Process comments
        for comment in f.get("comments", []):
            comment_by = db.users.find_one({"uid": comment["by"]}, {"name": 1})
            comment["byName"] = comment_by["name"] if comment_by else comment["by"]
        
        feedbacks.append(f)
    
    return feedbacks

# Update feedback
@app.put("/feedback/{feedback_id}")
async def update_feedback(feedback_id: str, update_data: dict = Body(...), user=Depends(verify_token)):
    db_user = db.users.find_one({"uid": user["uid"]})
    if not db_user or db_user.get("role") != "manager":
        raise HTTPException(status_code=403, detail="Only managers can update feedback")
    
    feedback = db.feedbacks.find_one({"_id": ObjectId(feedback_id)})
    if not feedback:
        raise HTTPException(status_code=404, detail="Feedback not found")
    if feedback["from"] != user["uid"]:
        raise HTTPException(status_code=403, detail="You can only update your own feedback")
    
    allowed_fields = {"strengths", "improvements", "sentiment"}
    updates = {k: v for k, v in update_data.items() if k in allowed_fields}
    
    if not updates:
        raise HTTPException(status_code=400, detail="No valid fields to update")
    
    db.feedbacks.update_one({"_id": ObjectId(feedback_id)}, {"$set": updates})
    return {"status": "success", "message": "Feedback updated successfully"}

# Acknowledge feedback
@app.put("/feedback/{feedback_id}/acknowledge")
async def acknowledge_feedback(feedback_id: str, user=Depends(verify_token)):
    feedback = db.feedbacks.find_one({"_id": ObjectId(feedback_id)})
    if not feedback:
        raise HTTPException(status_code=404, detail="Feedback not found")
    if feedback["to"] != user["uid"]:
        raise HTTPException(status_code=403, detail="You can only acknowledge feedback given to you")
    
    db.feedbacks.update_one(
        {"_id": ObjectId(feedback_id)},
        {"$set": {"acknowledged": True}}
    )
    
    employee = db.users.find_one({"uid": user["uid"]}, {"name": 1})
    db.notifications.insert_one({
        "to": feedback["from"],
        "message": f"{employee['name']} acknowledged your feedback.",
        "timestamp": datetime.utcnow(),
        "read": False
    })
    
    return {"status": "success", "message": "Feedback acknowledged and manager notified"}

# Get notifications
@app.get("/notifications")
async def get_notifications(user=Depends(verify_token)):
    user_uid = user["uid"]
    role = user.get("role", "").lower()
    
    if role == "manager":
        team_uids = [m["uid"] for m in db.users.find({"manager": user_uid}, {"uid": 1})]
        query = {"to": {"$in": team_uids}}
    else:
        query = {"to": user_uid}
    
    notifications = []
    for n in db.notifications.find(query).sort("timestamp", -1):
        n["id"] = str(n["_id"])
        del n["_id"]
        notifications.append(n)
    
    return notifications

# Mark notifications as read
@app.put("/notifications/mark-read")
async def mark_notifications_as_read(user=Depends(verify_token)):
    result = db.notifications.update_many(
        {"to": user["uid"], "read": False},
        {"$set": {"read": True}}
    )
    return {"status": "success", "updated_count": result.modified_count}

# Comment on feedback
@app.post("/feedback/{feedback_id}/comment")
async def comment_on_feedback(
    feedback_id: str,
    data: dict = Body(...),
    user=Depends(verify_token)
):
    text = data.get("text", "").strip()
    if not text:
        raise HTTPException(status_code=400, detail="Comment text required")
    
    feedback = db.feedbacks.find_one({"_id": ObjectId(feedback_id)})
    if not feedback:
        raise HTTPException(status_code=404, detail="Feedback not found")
    if feedback["to"] != user["uid"]:
        raise HTTPException(status_code=403, detail="You can only comment on feedback given to you")
    
    comment = {
        "by": user["uid"],
        "text": text,
        "date": datetime.utcnow()
    }
    db.feedbacks.update_one(
        {"_id": ObjectId(feedback_id)},
        {"$push": {"comments": comment}}
    )
    
    employee = db.users.find_one({"uid": user["uid"]}, {"name": 1})
    db.notifications.insert_one({
        "to": feedback["from"],
        "message": f"{employee['name']} commented on your feedback.",
        "timestamp": datetime.utcnow(),
        "read": False
    })
    
    return {"status": "success"}

# Request feedback
@app.post("/feedback/request")
async def request_feedback(user=Depends(verify_token)):
    employee = db.users.find_one({"uid": user["uid"]})
    if not employee:
        raise HTTPException(status_code=404, detail="User not found")
    
    manager_uid = employee.get("manager")
    if not manager_uid:
        raise HTTPException(status_code=400, detail="No manager assigned")
    
    db.notifications.insert_one({
        "to": manager_uid,
        "message": f"{employee.get('name', 'An employee')} has requested feedback.",
        "timestamp": datetime.utcnow(),
        "read": False
    })
    
    return {"status": "success", "message": "Feedback request sent to manager"}