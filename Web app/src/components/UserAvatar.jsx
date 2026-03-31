export default function UserAvatar({ email, onClick }) {
  if (!email) return null;
  
  const initial = email.charAt(0).toUpperCase();

  return (
    <div 
      className="user-avatar" 
      title={email}
      aria-label={`User profile for ${email}`}
      onClick={onClick}
      style={onClick ? { cursor: "pointer" } : undefined}
    >
      {initial}
    </div>
  );
}
