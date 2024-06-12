import React, { useState, useEffect, useRef } from "react";
import gsap from "gsap";
import AdminPage from "./AdminPage";

const adminAddress = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

const Connected = (props) => {
    const [selectedCandidate, setSelectedCandidate] = useState(null);
    const isAdmin = props.account.toLowerCase() === adminAddress.toLowerCase();
    const tableRef = useRef();

    useEffect(() => {
        if (tableRef.current) {
            const rows = gsap.utils.toArray(tableRef.current.querySelectorAll("tr"));
            rows.forEach((row) => {
                const onMouseEnter = () => gsap.to(row, { scale: 1.05, borderRadius: "10px", duration: 0.3 });
                const onMouseLeave = () => gsap.to(row, { scale: 1, borderRadius: "0", duration: 0.3 });

                row.addEventListener("mouseenter", onMouseEnter);
                row.addEventListener("mouseleave", onMouseLeave);

                // Cleanup function to remove event listeners
                return () => {
                    row.removeEventListener("mouseenter", onMouseEnter);
                    row.removeEventListener("mouseleave", onMouseLeave);
                };
            });
        }
    }, [tableRef.current]);

    useEffect(() => {
        if (!props.showButton) {
            props.getCandidates();
        }
    }, [props.showButton, props.getCandidates]);

    const handleCandidateClick = (index) => {
        setSelectedCandidate(index);
        props.setSelectedCandidate(index); // Ajout de cette ligne
    };

    return (
        <div className="connected-container">
            {isAdmin ? (
                <>
                    <h1 className="connected-header" style={{ fontSize: 75 }}>Admin Page</h1>
                    <AdminPage
                        newCandidateName={props.newCandidateName}
                        handleNewCandidateChange={props.handleNewCandidateChange}
                        newCandidateImage={props.newCandidateImage}
                        handleNewCandidateImageChange={props.handleNewCandidateImageChange}
                        addCandidate={props.addCandidate}
                    />
                </>
            ) : (
                <>
                    {props.showButton ? (
                        <>
                            <div className="candidates-container">
                                <h1 className="connected-header" style={{ fontSize: 45 }}>Vote for your favorite NFT</h1>
                                {props.candidates.map((candidate, index) => (
                                    <div
                                        key={index}
                                        className={`candidate-item ${
                                            selectedCandidate === index ? "selected" : ""
                                        }`}
                                        onClick={() => handleCandidateClick(index)}
                                    >
                                        <img
                                            className="candidate-image"
                                            alt={`Candidate #${index + 1}`}
                                            src={candidate.image}
                                        />
                                        <p>{candidate.name}</p>
                                    </div>
                                ))}
                            </div>
                            {selectedCandidate !== null && (
                                <div className="vote-button-container">
                                    <button
                                        className="vote-button"
                                        onClick={() => props.voteFunction(selectedCandidate)}
                                    >
                                        Vote
                                    </button>
                                </div>
                            )}
                        </>
                    ) : (
                        <div>
                            <h1 className="connected-header" style={{ fontSize: 55 }}>Total Votes</h1>
                            <div className="table-container" ref={tableRef}>
                                <table className="candidates-table">
                                    <thead>
                                    <tr>
                                        <th>Candidate Image</th>
                                        <th>Candidate Name</th>
                                        <th>Candidate Votes</th>
                                        <th>Vote Percentage</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {props.candidates
                                        .sort((a, b) => b.voteCount - a.voteCount)
                                        .map((candidate, index) => {
                                            const votePercentage =
                                                props.totalVotes > 0
                                                    ? ((candidate.voteCount / props.totalVotes) * 100).toFixed(2)
                                                    : 0;
                                            return (
                                                <tr key={index}>
                                                    <td>
                                                        <img
                                                            className="image"
                                                            alt={`Uploaded #${index + 1}`}
                                                            src={candidate.image}
                                                        />
                                                    </td>
                                                    <td>{candidate.name}</td>
                                                    <td>{candidate.voteCount}</td>
                                                    <td>{votePercentage}%</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default Connected;
