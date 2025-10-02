import React from 'react';

const AccountPreferences = () => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold mb-4">Account Preferences</h3>
      <div className="space-y-4">
        <div>
          <label className="flex items-center">
            <input type="checkbox" className="mr-2" />
            <span>Email notifications</span>
          </label>
        </div>
        <div>
          <label className="flex items-center">
            <input type="checkbox" className="mr-2" />
            <span>SMS notifications</span>
          </label>
        </div>
        <div>
          <label className="flex items-center">
            <input type="checkbox" className="mr-2" />
            <span>Marketing emails</span>
          </label>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Save Preferences</button>
      </div>
    </div>
  );
};

export default AccountPreferences; 