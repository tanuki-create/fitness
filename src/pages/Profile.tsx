import { useState } from 'react';
import { user as initialUser } from '../data/mockData';
import './Profile.css';

const Profile = () => {
  const [user, setUser] = useState(initialUser);
  const [isEditing, setIsEditing] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsEditing(false);
    // In a real app, you'd save this to a server
  };

  return (
    <div className="profile-container">
      <h1>Your Profile</h1>
      <div className="profile-card">
        {isEditing ? (
          <form onSubmit={handleSave}>
            <div className="form-group">
              <label htmlFor="name">Name</label>
              <input
                id="name"
                type="text"
                value={user.name}
                onChange={(e) => setUser({ ...user, name: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label htmlFor="goal">Fitness Goal</label>
              <textarea
                id="goal"
                value={user.goal}
                onChange={(e) => setUser({ ...user, goal: e.target.value })}
              />
            </div>
            <button type="submit" className="save-btn">Save</button>
            <button type="button" onClick={() => setIsEditing(false)} className="cancel-btn">Cancel</button>
          </form>
        ) : (
          <>
            <p><strong>Name:</strong> {user.name}</p>
            <p><strong>Goal:</strong> {user.goal}</p>
            <button onClick={() => setIsEditing(true)} className="edit-btn">Edit Profile</button>
          </>
        )}
      </div>
    </div>
  );
};

export default Profile; 