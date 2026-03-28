import React from "react";

export default function UserAvatar({ email }) {
  if (!email) return null;
  
  const initial = email.charAt(0).toUpperCase();

  return (
    <div 
      className="user-avatar" 
      title={email}
      aria-label={`User profile for ${email}`}
    >
      {initial}
    </div>
  );
}
