import { useEffect, useState } from "react";
import Observable from "zen-observable";
import reactLogo from "./assets/react.svg";
import "./App.css";
import { combineLatest } from "./combineLatest";

const MIC_LEVEL_NORMALIZATION = {
  FACTOR: 100,
  FLOOR: 10,
  CEILING: 20,
};
const RANDOMIZE_VALUE_MAX_TIMEOUT = 1500;

function App() {
  const [isTrue, setIsTrue] = useState(false);

  useEffect(() => {
    let previousValue3: number = 0;

    const observable1 = new Observable<boolean>((observer) => {
      const setRandomValue = () => {
        // 20% chance of evaluating to true;
        let value = Math.random() > 0.8;
        observer.next(value);
      };
      // Recursively set a new timer
      let timer: number | undefined;
      const processTimer = () => {
        timer = setTimeout(() => {
          setRandomValue();
          processTimer();
        }, Math.random() * RANDOMIZE_VALUE_MAX_TIMEOUT);
      };
      processTimer();

      // On unsubscription, cancel the timer
      return () => clearTimeout(timer);
    });

    const observable2 = new Observable<boolean>((observer) => {
      const setRandomValue = () => {
        // 20% chance of evaluating to true;
        let value = Math.random() > 0.8;
        observer.next(value);
      };
      // Recursively set a new timer
      let timer: number | undefined;
      const processTimer = () => {
        timer = setTimeout(() => {
          setRandomValue();
          processTimer();
        }, Math.random() * RANDOMIZE_VALUE_MAX_TIMEOUT);
      };
      processTimer();

      // On unsubscription, cancel the timer
      return () => clearTimeout(timer);
    });

    const observable3 = new Observable<number>((observer) => {
      let value: number = 0;

      const setRandomValue = () => {
        // Set a random mic level
        value = Math.random() * 100;
        observer.next(value);
      };

      // Recursively set a new timer
      let timer: number | undefined;
      const processTimer = () => {
        timer = setTimeout(() => {
          setRandomValue();
          processTimer();
        }, Math.random() * RANDOMIZE_VALUE_MAX_TIMEOUT);
      };
      processTimer();

      // On unsubscription, cancel the timer
      return () => clearTimeout(timer);
    }).map((value) => {
      if (
        value > previousValue3 &&
        ((previousValue3 / value) * MIC_LEVEL_NORMALIZATION.FACTOR >=
          MIC_LEVEL_NORMALIZATION.FLOOR ||
          previousValue3 === 0)
      ) {
        previousValue3 = value;
        return true;
      } else if (
        value < previousValue3 &&
        (value / previousValue3) * MIC_LEVEL_NORMALIZATION.FACTOR <=
          MIC_LEVEL_NORMALIZATION.CEILING
      ) {
        previousValue3 = value;
        return false;
      }
      return false;
    });

    // subscribe to changes to the latest of each
    let previousValue = false;
    const observable = combineLatest(observable1, observable2, observable3);
    const subscription = observable.subscribe((latest) => {
      const latestIsTrue = latest.includes(true);
      if (latestIsTrue !== previousValue) {
        console.log("new value", latestIsTrue);
        previousValue = latestIsTrue;
        setIsTrue(latestIsTrue);
      }
    });
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <div className="App">
      <div>
        <a href="https://vitejs.dev" target="_blank">
          <img src="/vite.svg" className="logo" alt="Vite logo" />
        </a>
        <a href="https://reactjs.org" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Latest observable</h1>
      <p className="read-the-docs">{`${isTrue}`}</p>
    </div>
  );
}

export default App;
