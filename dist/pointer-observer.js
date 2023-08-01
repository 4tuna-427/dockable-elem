class PointerObserver {
    static array() {
        return PointerObserver.paramObjects;
    }
    static last() {
        return PointerObserver.paramObjects[PointerObserver.paramObjects.length - 1];
    }
}
PointerObserver.paramObjects = [];
(() => {
    const pushParam = (pointerEvent) => {
        PointerObserver.paramObjects.push({
            position: {
                x: pointerEvent.pageX,
                y: pointerEvent.pageY
            },
            pressure: pointerEvent.pressure
        });
    };
    window.addEventListener('pointerdown', (event) => {
        PointerObserver.paramObjects = [];
        pushParam(event);
    });
    window.addEventListener('pointermove', (event) => {
        PointerObserver.paramObjects = [];
        const events = event.getCoalescedEvents();
        events.forEach(e => {
            pushParam(e);
        });
    });
    window.addEventListener('pointerup', (event) => {
        PointerObserver.paramObjects = [];
        pushParam(event);
    });
})();
export default PointerObserver;
//# sourceMappingURL=pointer-observer.js.map