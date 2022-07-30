import { useEffect, useState } from "react";
import Observable from "zen-observable";
import reactLogo from "./assets/react.svg";
import "./App.css";
import { combineLatest } from "./combineLatest";

const NUMBER_LEVEL_NORMALIZATION = {
  FACTOR: 100,
  FLOOR: 10,
  CEILING: 20,
};
const RANDOMIZE_VALUE_MAX_TIMEOUT = 1500;

interface ITestMergedBooleanValue {
  isTrue: boolean;
  // the unique IDs assigned to the observable that
  // caused this to evaluate to true, if any
  isTrueObservableIds: string[];
}
interface ITestBoolean {
  // the unique ID assigned to an observable
  observableId: string;
  // boolean value of the observable
  isTrue: boolean;
}
interface ITestNumber {
  // the unique ID assigned to an observable
  observableId: string;
  // current value of the observable
  value: number;
}

function App() {
  const [mergedTestValue, setMergedTestValue] =
    useState<ITestMergedBooleanValue>({
      isTrue: false,
      isTrueObservableIds: [],
    });

  // Listen to three distinct boolean observables and check if any single
  // value is true. If the value has changed from the previous boolean,
  // we set isTrue to the new value and console log.
  useEffect(() => {
    // Our first two observables will have the same logic, but will yield separate
    // values in each. This callback will randomly change the observable to true/false.
    const getOnBooleanSubscriber = (
      observableId: string,
      probabilityBetweenZeroAndOne: number
    ): ZenObservable.Subscriber<ITestBoolean> => {
      const onBooleanSubscriber: ZenObservable.Subscriber<ITestBoolean> = (
        observer
      ) => {
        // Push a weighted random true/false value through the observer
        const setRandomValue = () => {
          // 20% chance of evaluating to true
          let isTrue = Math.random() > probabilityBetweenZeroAndOne;
          observer.next({
            observableId,
            isTrue,
          });
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
      return onBooleanSubscriber;
    };

    const observable1 = new Observable<ITestBoolean>(
      getOnBooleanSubscriber("OBSERVABLE-1", 0.5)
    );

    const observable2 = new Observable<ITestBoolean>(
      getOnBooleanSubscriber("OBSERVABLE-2", 0.8)
    );

    // This third observable works differently. It will randomly set a value
    // between 0 and 100, and test to see if the number has changed drastically
    // from the previous one, evaluating to true/false
    let previousNumericValue: number = 0;
    const getOnNumberEvaluateSubscriber = (
      observableId: string
    ): ZenObservable.Subscriber<ITestNumber> => {
      const onNumberSubscriber: ZenObservable.Subscriber<ITestNumber> = (
        observer
      ) => {
        let value: number = 0;

        const setRandomValue = () => {
          // Set a random mic level
          value = Math.random() * 100;
          observer.next({
            observableId,
            value: value,
          });
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
      return onNumberSubscriber;
    };

    const observable3: Observable<ITestBoolean> = new Observable<ITestNumber>(
      getOnNumberEvaluateSubscriber("OBSERVABLE-3")
    ).map((testNumber): ITestBoolean => {
      if (
        testNumber.value > previousNumericValue &&
        ((previousNumericValue / testNumber.value) *
          NUMBER_LEVEL_NORMALIZATION.FACTOR >=
          NUMBER_LEVEL_NORMALIZATION.FLOOR ||
          previousNumericValue === 0)
      ) {
        previousNumericValue = testNumber.value;
        return {
          observableId: testNumber.observableId,
          isTrue: true,
        };
      } else if (
        testNumber.value < previousNumericValue &&
        (testNumber.value / previousNumericValue) *
          NUMBER_LEVEL_NORMALIZATION.FACTOR <=
          NUMBER_LEVEL_NORMALIZATION.CEILING
      ) {
        previousNumericValue = testNumber.value;
        return {
          observableId: testNumber.observableId,
          isTrue: false,
        };
      }
      return {
        observableId: testNumber.observableId,
        isTrue: false,
      };
    });

    // Subscribe to changes to the latest of each
    let previousValue = false;
    const observable = combineLatest(observable1, observable2, observable3);
    const subscription = observable.subscribe((latest) => {
      const trueTestValues = latest.filter((testValue) => testValue.isTrue);
      const latestIsTrue = trueTestValues.length > 0;
      if (latestIsTrue !== previousValue) {
        console.log("new value", latestIsTrue);
        previousValue = latestIsTrue;
        setMergedTestValue({
          isTrue: latestIsTrue,
          isTrueObservableIds: trueTestValues.map(
            (testValue) => testValue.observableId
          ),
        });
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
      <p className="read-the-docs">{`${mergedTestValue.isTrue}`}</p>
      <h3>True observable IDs</h3>
      {mergedTestValue.isTrueObservableIds.map((observableId) => (
        <p className="read-the-docs" key={observableId}>
          {observableId}
        </p>
      ))}
    </div>
  );
}

export default App;
