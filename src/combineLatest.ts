import Observable from 'zen-observable';

// Emits arrays containing the most current values from each input
export function combineLatest<S>(...sources: Observable<S>[]): Observable<S[]> {
    if (sources.length === 0) {
        return Observable<(S)[]>.from([]);
    }

    const subscriber = (observer: ZenObservable.SubscriptionObserver<S[]>) => {
        let count = sources.length;
        let seen: Set<number> | null = new Set();
        let seenAll = false;
        let values: (S | undefined)[] = sources.map(() => undefined);
    
        let subscriptions = sources
          .map((source, index) => {
              return Observable<S[]>.from(source)
                  .subscribe({
                      next(v) {
                          values[index] = v;
                  
                          if (!seenAll) {
                              seen?.add(index);
                              if (seen?.size !== sources.length) {
                                  return;
                              }
                  
                              seen = null;
                              seenAll = true;
                          }
                          const nextValues = Array.from(values) as S[];
                          observer.next(nextValues);
                      },
                      error(e) {
                          observer.error(e);
                      },
                      complete() {
                          if (--count === 0) {
                              observer.complete();
                          }
                      },
                  });
          });
        return () => subscriptions.forEach(s => s.unsubscribe());
    };

    return new Observable<S[]>(subscriber);
  }