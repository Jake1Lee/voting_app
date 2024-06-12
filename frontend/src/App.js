import React, { useState, useEffect } from "react";
import axios from "axios";
import { ethers } from "ethers";
import { contractAbi, contractAddress } from "./Constant/constant";
import AnimatedLanding from "./Components/AnimatedLanding";
import Finished from "./Components/Finished";
import Connected from "./Components/Connected";
import "./App.css";

const pinataApiKey = "4f1002c7848e08818d79";
const pinataSecretApiKey =
    "c1d346de0e33fd41f943544d53d8e812e72c2924ffa70bac93650b8510dc59c8";

const isDevelopment = true; // Set this to true during development

function App() {
  const [provider, setProvider] = useState(null);
  const [account, setAccount] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [votingStatus, setVotingStatus] = useState(true);
  const [remainingTime, setRemainingTime] = useState("");
  const [candidates, setCandidates] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [isAllowedToVote, setIsAllowedToVote] = useState(true);
  const [newCandidateName, setNewCandidateName] = useState("");
  const [newCandidateImage, setNewCandidateImage] = useState(null);
  const [totalVotes, setTotalVotes] = useState(0);
  const [forcedVotingStatus, setForcedVotingStatus] = useState(true); // `null` for normal behavior

  useEffect(() => {
    if (forcedVotingStatus !== null) {
      setVotingStatus(forcedVotingStatus);
    } else {
      getCandidates();
      getRemainingTime();
      if (!isDevelopment) {
        getCurrentStatus();
      }
    }
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", handleAccountsChanged);
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
      }
    };
  }, [forcedVotingStatus]);

  async function vote(candidateIndex) {
    if (candidateIndex === null) {
      return alert("Please select a candidate to vote for");
    }

    const provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    const signer = provider.getSigner();
    const contractInstance = new ethers.Contract(contractAddress, contractAbi, signer);

    try {
      const tx = await contractInstance.vote(candidateIndex);
      await tx.wait();
      checkIfCanVote();
      getCandidates(); // Update the candidate list after voting
    } catch (error) {
      console.error("Error during voting:", error);
      alert("Failed to vote. Please try again.");
    }
  }

  async function addCandidate() {
    if (!newCandidateName || !newCandidateImage) {
      return alert("Please enter candidate name and select an image");
    }

    try {
      const formData = new FormData();
      formData.append("file", newCandidateImage);

      const metadata = JSON.stringify({
        name: newCandidateImage.name,
        keyvalues: {
          description: "Candidate image uploaded using Pinata",
        },
      });

      formData.append("pinataMetadata", metadata);
      formData.append("pinataOptions", JSON.stringify({ cidVersion: 1 }));

      const result = await axios.post(
          "https://api.pinata.cloud/pinning/pinFileToIPFS",
          formData,
          {
            maxBodyLength: "Infinity",
            headers: {
              "Content-Type": `multipart/form-data; boundary=${formData._boundary}`,
              pinata_api_key: pinataApiKey,
              pinata_secret_api_key: pinataSecretApiKey,
            },
          }
      );

      const imageUrl = `https://gateway.pinata.cloud/ipfs/${result.data.IpfsHash}`;

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = provider.getSigner();
      const contractInstance = new ethers.Contract(
          contractAddress,
          contractAbi,
          signer
      );

      const tx = await contractInstance.addCandidate(newCandidateName, imageUrl);
      await tx.wait();
      getCandidates();
    } catch (error) {
      console.error("Error uploading image to Pinata:", error);
      if (error.code === 'ACTION_REJECTED') {
        alert("Transaction was rejected by the user.");
      } else {
        alert("Failed to upload image to Pinata or add candidate. Please try again.");
      }
    }
  }

  async function checkIfCanVote() {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    const signer = provider.getSigner();
    const contractInstance = new ethers.Contract(
        contractAddress,
        contractAbi,
        signer
    );
    const voteStatus = await contractInstance.voters(await signer.getAddress());
    setIsAllowedToVote(voteStatus);
  }

  async function getCandidates() {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    const signer = provider.getSigner();
    const contractInstance = new ethers.Contract(
        contractAddress,
        contractAbi,
        signer
    );
    const candidatesList = await contractInstance.getAllVotesOfCandidates();
    const formattedCandidates = candidatesList.map((candidate, index) => {
      return {
        index: index,
        name: candidate.name,
        voteCount: candidate.voteCount.toNumber(),
        image: candidate.image,
      };
    });
    setCandidates(formattedCandidates);
    setTotalVotes(
        formattedCandidates.reduce((total, candidate) => total + candidate.voteCount, 0)
    );
  }

  async function getCurrentStatus() {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    const signer = provider.getSigner();
    const contractInstance = new ethers.Contract(
        contractAddress,
        contractAbi,
        signer
    );
    const status = await contractInstance.getVotingStatus();
    setVotingStatus(status);
  }

  async function getRemainingTime() {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    const signer = provider.getSigner();
    const contractInstance = new ethers.Contract(
        contractAddress,
        contractAbi,
        signer
    );
    const time = await contractInstance.getRemainingTime();
    setRemainingTime(parseInt(time, 16));
  }

  function handleAccountsChanged(accounts) {
    if (accounts.length > 0 && account !== accounts[0]) {
      setAccount(accounts[0]);
      checkIfCanVote();
    } else {
      setIsConnected(false);
      setAccount(null);
    }
  }

  async function connectToMetamask() {
    if (window.ethereum) {
      try {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        setProvider(provider);
        await provider.send("eth_requestAccounts", []);
        const signer = provider.getSigner();
        const address = await signer.getAddress();
        setAccount(address);
        setIsConnected(true);
        checkIfCanVote();
      } catch (err) {
        console.error(err);
      }
    } else {
      console.error("Metamask is not detected in the browser");
    }
  }

  function handleNewCandidateChange(e) {
    setNewCandidateName(e.target.value);
  }

  function handleNewCandidateImageChange(e) {
    setNewCandidateImage(e.target.files[0]);
  }

  return (
      <div className="app">
        {votingStatus ? (
            isConnected ? (
                <Connected
                    account={account}
                    candidates={candidates}
                    remainingTime={remainingTime}
                    voteFunction={vote}
                    showButton={!isAllowedToVote}
                    newCandidateName={newCandidateName}
                    handleNewCandidateChange={handleNewCandidateChange}
                    newCandidateImage={newCandidateImage}
                    handleNewCandidateImageChange={handleNewCandidateImageChange}
                    addCandidate={addCandidate}
                    totalVotes={totalVotes}
                    getCandidates={getCandidates}
                    setSelectedCandidate={setSelectedCandidate} // Ajout de cette ligne
                />
            ) : (
                <AnimatedLanding connectWallet={connectToMetamask} />
            )
        ) : (
            <Finished />
        )}
      </div>
  );
}

export default App;
