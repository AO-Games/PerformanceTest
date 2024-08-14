import './App.css';
import { useState } from 'react';
import Arweave from "arweave";
import * as WarpArBundles from 'warp-arbundles'
import {dryrun, message, spawn } from "@permaweb/aoconnect/browser";

const pkg = WarpArBundles.default ? WarpArBundles.default : WarpArBundles
const { createData, ArweaveSigner } = pkg

const counterId = "sHMWxtK2d2he_MlRdp_mZJeW_btQYyIVGTF2qg-7Hwc"

export function createDataItemSigner (wallet) {
  const signer = async ({ data, tags, target, anchor }) => {
    const signer = new ArweaveSigner(wallet)
    const dataItem = createData(data, signer, { tags, target, anchor })
    return dataItem.sign(signer)
      .then(async () => ({
        id: await dataItem.id,
        raw: await dataItem.getRaw()
      }))
  }

  return signer
}

async function messageToAO(wallet, process, data, action) {
  try {
    const messageId = await message({
      process: process,
      signer: createDataItemSigner(wallet),
      tags: [{ name: 'Action', value: action }],
      data: JSON.stringify(data)
    });
    return messageId;
  } catch (error) {
    console.log("messageToAO -> error:", error)
    return '';
  }
}

export async function getDataFromAO(process, action, data) {
  let result;
  try {
    result = await dryrun({
      process,
      data: JSON.stringify(data),
      tags: [{ name: 'Action', value: action }]
    });
  } catch (error) {
    console.log('getDataFromAO --> ERR:', error)
    return '';
  }
  const resp = result.Messages?.length > 0 ? result.Messages[0].Data : null;

  if (resp) {
  return JSON.parse(resp);
  } else {
    console.error("No messages received");
    return null;
  }
}

async function count() {
  const wallet = await new Arweave.init({}).wallets.generate();
  await messageToAO(wallet, counterId, {}, "Count");
  console.log("Counted!!");
}

async function read() {
  const data = await getDataFromAO(counterId, "GetCount", {});
  console.log(data);
}

async function reset() {
  const wallet = await new Arweave.init({}).wallets.generate();
  await messageToAO(wallet, counterId, {}, "ResetCount");
  console.log("reset!!");
}

function Count1Button() {
  return (
    <button onClick={count}>
      Count + 1
    </button>
  );
}

function ReadButton() {
  return (
    <button onClick={read}>
      Read Count
    </button>
  );
}

function ResetButton() {
  return (
    <button onClick={reset}>
      Reset
    </button>
  );
}

function CountMonitor() {
  const [value, setValue] = useState(0);

  function toggleLoop() {
    setInterval(async () => {
      const data = await getDataFromAO(counterId, "GetCount", {});
      setValue(data)
    }, 2000);
  }

  return (
    <button onClick={toggleLoop}>
      dryrun count: {value}
    </button>
  );
}


function Add10TPS({onClick}) {
  return (
    <button onClick={onClick}>
      + 10 TPS
    </button>
  );
}

function App() {
  const [totalWallets, setTotalWallets] = useState(0);
  const [total, setTotal] = useState(0);

  async function add10TPS() {
      const wallets = await Promise.all(
        Array(10).fill().map(() => new Arweave.init({}).wallets.generate())
    );
    setTotalWallets(prevTotalWallets => prevTotalWallets + 10);
    setInterval(async () => {
      wallets.map(async wallet => {
        await messageToAO(wallet, counterId, {}, "Count");
      });
      setTotal(prevTotal => prevTotal + 10);
    }, 1000);
  }

  return (
    <div className="App">
      <header>
        <p>Check the console</p>
      </header>
      <Count1Button />
      <ReadButton />
      <p></p>
      <ResetButton />
      <p></p>
      <Add10TPS onClick={add10TPS}/> Total: {total}, Wallets: {totalWallets}
      <p></p>
      Click to Monitor <CountMonitor />
    </div>
  );
}

export default App;
