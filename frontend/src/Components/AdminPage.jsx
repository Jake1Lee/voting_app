import React from "react";

const AdminPage = ({
                       newCandidateName,
                       handleNewCandidateChange,
                       newCandidateImage,
                       handleNewCandidateImageChange,
                       addCandidate,
                   }) => {
    return (
        <div className="admin-container">
            <h2 className="admin-header">Add Candidates</h2>
            <div className="admin-form">
                <input
                    type="text"
                    value={newCandidateName}
                    onChange={handleNewCandidateChange}
                    placeholder="Candidate Name"
                    className="admin-input"
                />
                <input
                    type="file"
                    onChange={handleNewCandidateImageChange}
                    className="admin-input"
                />
                <button className="admin-button" onClick={addCandidate}>
                    Add Candidate
                </button>
            </div>
        </div>
    );
};

export default AdminPage;
