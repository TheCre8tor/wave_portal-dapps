import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import PureModal from "react-pure-modal";
import { SpinnerDotted } from "spinners-react";
import { toast, ToastContainer } from "react-toastify";

import "./App.scss";
import "react-pure-modal/dist/react-pure-modal.min.css";
import "react-toastify/dist/ReactToastify.css";

import alexDp from "./alexander.jpeg";
import abi from "./utils/WavePortal.json";

export default function App() {
  const [currentAccount, setCurrentAccount] = useState("");
  const [counts, setCounts] = useState(0);
  const [metaState, setMetaState] = useState("Disconnected");
  const [modal, setModal] = useState(false);
  const [miningState, setMiningState] = useState("Mining...");
  const [allWaves, setAllWaves] = useState([]);
  const [message, setMessage] = useState("");

  const contractAddress = "0x571116CE2A13bb94D3a0CEa7D595b0D7D0fa2502";
  const contractABI = abi.abi;

  useEffect(() => {
    checkIfWalletIsConnected();
    getWaveCount();

    // Come back to study this code.
    let wavePortalContract;

    const onNewWave = (from, timestamp, message) => {
      console.log("NewWave", from, timestamp, message);
      setAllWaves((prevState) => [
        ...prevState,
        {
          address: from,
          timestamp: new Date(timestamp * 1000),
          message: message,
        },
      ]);
    };

    if (window.ethereum) {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      wavePortalContract = new ethers.Contract(
        contractAddress,
        contractABI,
        signer
      );

      wavePortalContract.on("NewWave", onNewWave);
    }

    return () => {
      if (wavePortalContract) {
        wavePortalContract.off("NewWave", onNewWave);
      }
    };
  }, []);

  const checkIfWalletIsConnected = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        setMetaState("Not Installed");
      } else {
        setMetaState("Disconnected");
      }

      const accounts = await ethereum.request({ method: "eth_accounts" });

      if (accounts.length !== 0) {
        setMetaState("Connected");
        getAllWaves();
      } else {
        toast.info("No authorized account found", {
          autoClose: 2000,
        });
      }
    } catch (err) {
      setMetaState("Not Installed");
    }
  };

  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        toast.error("Get MetaMask!", {
          autoClose: 2000,
        });

        return;
      }

      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });

      setCurrentAccount(accounts[0]);
      window.location.reload(true);
    } catch (error) {
      toast.error(
        "You have Metamask installed, but didn't grant permission to connect!"
      );
    }
  };

  const wave = async () => {
    try {
      setModal(true);
      setMiningState(`Preparing contract for mining...`);

      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();

        const wavePortalContract = new ethers.Contract(
          contractAddress,
          contractABI,
          signer
        );

        const waveTxn = await wavePortalContract.wave(message, {
          gasLimit: 300000,
        });
        setMiningState(`Mining: ${waveTxn.hash}...`);

        await waveTxn.wait();
        setMiningState(`Mined: ${waveTxn.hash}...`);
        setModal(false);
        // window.location.reload(true);
      } else {
        console.log("Ethereum object doesn't exist!");
        setModal(false);
      }
    } catch (error) {
      toast.error("Wait 5 minutes before waving again.", {
        autoClose: 4000,
      });
      setModal(false);
    }
  };

  const getWaveCount = async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();

        const wavePortalContract = new ethers.Contract(
          contractAddress,
          contractABI,
          signer
        );

        let count = await wavePortalContract.getTotalWaves();
        setCounts(count.toNumber());
      }
    } catch (err) {
      console.log(err);
      toast.error("Can't fetch wave counts", {
        autoClose: 3000,
      });
    }
  };

  const getAllWaves = async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(
          contractAddress,
          contractABI,
          signer
        );

        const waves = await wavePortalContract.getAllWaves();

        let wavesCleaned = [];

        waves.forEach((wave) => {
          wavesCleaned.push({
            address: wave.waver,
            timestamp: new Date(wave.timestamp * 1000),
            message: wave.message,
          });
        });

        setAllWaves(wavesCleaned);
      }
    } catch (err) {
      console.log(err);
    }
  };

  const isMetaMaskConnected = () => {
    return metaState === "Not Installed" || metaState === "Disconnected";
  };

  const validateBeforeWave = () => {
    const isConnected = metaState === "Connected";

    if (!!message === false) {
      return toast.error(
        "Your comments is valid. Add a comments before waving!",
        {
          autoClose: 3000,
        }
      );
    }

    if (!isConnected) {
      toast.error(
        "Oh! friend, you need to connect you MetaMask Wallet before you can wave at me...",
        {
          autoClose: 4000,
        }
      );
    } else {
      wave();
      setMessage("");
    }
  };

  const getInformedMsg = () => {
    const isConnected = metaState === "Connected";

    if (!isConnected) {
      return "Connect your Ethereum wallet, and wave at me!";
    } else {
      return "Thank you for connecting your Ethereum Wallet, kindly comment and ⚡smatch the Wave Button";
    }
  };

  const noWavesOrNotConnected = () => {
    const isConnected = metaState === "Connected";

    if (!isConnected) {
      return "Connect your wallet to view all wavers";
    } else {
      return "No one has waved since century...";
    }
  };

  const handleChange = (event) => {
    const message = event.target.value;
    setMessage(message);
  };

  return (
    <div className="main_container">
      <ToastContainer className="style-toast" />
      <PureModal
        isOpen={modal}
        className="style-modal"
        closeButtonPosition="bottom"
        onClose={() => {
          setModal(false);
          return true;
        }}
      >
        <div className="mining">
          <SpinnerDotted size={35} />
          <div className="mining__msg">{miningState}</div>
        </div>
      </PureModal>
      ;
      <div className="profile">
        <section className="profile__header">
          <div className="profile__header--count">
            <div className="profile__header--count-msg">👋 Counts:</div>
            <div className="profile__header--count-nums">{counts}</div>
          </div>

          <div className="profile__header--wallet">
            <div className="profile__header--wallet-icon">🦊</div>
            <div className="profile__header--wallet-divider" />
            <div className="profile__header--wallet-info">
              MetaMask
              <br />
              {metaState}.
            </div>
          </div>
        </section>
        <section className="profile__card">
          <div className="profile__card--image-container">
            <img
              src={alexDp}
              alt="Alexander"
              className="profile__card--image"
            />
          </div>

          <div className="profile__card--divider" />

          <div className="profile__card--greetings">
            <div className="profile__card--greetings-wave">👋</div>
            <div className="profile__card--greetings-msg">Hey there!</div>
            <div className="profile__card--greetings-intro">
              I am{" "}
              <span className="profile__card--greetings-intro-name">
                Alexander
              </span>
            </div>
          </div>
        </section>
        <div className="profile__bio">
          I worked on building smart contact on the Ethereum blockchain network,
          so that's pretty cool, right?
        </div>
        <div className="profile__divider" />
        <div className="profile__connect">{getInformedMsg()}</div>
        {isMetaMaskConnected() && (
          <div
            className="profile__metamask-btn"
            onClick={() => connectWallet()}
          >
            Connect MetaMask
          </div>
        )}

        {metaState === "Connected" && (
          <input
            type="text"
            name="message"
            value={message}
            onChange={handleChange}
            className="profile__input-field"
            placeholder="Do you have any comments on this project?"
            autoFocus
          />
        )}

        <div className="profile__wave-btn" onClick={() => validateBeforeWave()}>
          👋 Wave at Me 🤠
        </div>
      </div>
      <div
        className={`${
          metaState === "Connected" ? "messages--is_connected" : ""
        } messages`}
      >
        <div className="messages__header">
          <div className="messages__header-title">Super Waver 3.0</div>
        </div>

        <div
          className={`${
            metaState === "Connected"
              ? "messages__chat-container--is_connected"
              : ""
          } messages__chat-container`}
        >
          {allWaves.length !== 0 ? (
            allWaves.map((wave, idx) => {
              return (
                <div key={idx} className="messages__chat">
                  <div>
                    <div className="messages__chat-img" />
                  </div>

                  <div className="messages__chat-body">
                    <div className="messages__chat-header">
                      <div className="messages__chat-header--name">
                        Anonymous Waver
                      </div>
                      <div className="messages__chat-header--time">
                        {wave.timestamp.toLocaleTimeString()}
                      </div>
                    </div>

                    <div className="messages__chat-msg">{wave.message}</div>
                    <div className="messages__chat-sender">
                      <span className="messages__chat-sender--id">Sender</span>{" "}
                      {wave.address}
                    </div>
                    <div className="messages__chat-date">
                      {wave.timestamp.toDateString()}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="no-content">
              <span className="no-content--icon">📦</span> <br />
              {noWavesOrNotConnected()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
