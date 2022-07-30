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

  // Listen to three distinct boolean observables and check if any single
  // value is true. If the value has changed from the previous boolean,
  // we set isTrue to the new value and console log.
  useEffect(() => {
    // Our first two observables will have the same logic, but will yield separate
    // values in each. This callback will randomly change the observable to true/false.
    const onBooleanSubscriber: ZenObservable.Subscriber<boolean> = (
      observer
    ) => {
      // Push a weighted random true/false value through the observer
      const setRandomValue = () => {
        // 20% chance of evaluating to true
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
    };

    const observable1 = new Observable<boolean>(onBooleanSubscriber);

    const observable2 = new Observable<boolean>(onBooleanSubscriber);

    // This third observable works differently. It will randomly set a value
    // between 0 and 100, and test to see if the number has changed drastically
    // from the previous one, evaluating to true/false
    let previousNumericValue: number = 0;
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
        value > previousNumericValue &&
        ((previousNumericValue / value) * MIC_LEVEL_NORMALIZATION.FACTOR >=
          MIC_LEVEL_NORMALIZATION.FLOOR ||
          previousNumericValue === 0)
      ) {
        previousNumericValue = value;
        return true;
      } else if (
        value < previousNumericValue &&
        (value / previousNumericValue) * MIC_LEVEL_NORMALIZATION.FACTOR <=
          MIC_LEVEL_NORMALIZATION.CEILING
      ) {
        previousNumericValue = value;
        return false;
      }
      return false;
    });

    // Subscribe to changes to the latest of each
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
