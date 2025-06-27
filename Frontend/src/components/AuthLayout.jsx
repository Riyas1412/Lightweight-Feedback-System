// src/components/AuthLayout.jsx
const AuthLayout = ({ children }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-md">
        {children}
      </div>
    </div>
  );
};

export default AuthLayout;
