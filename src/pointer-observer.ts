type PointerParamObject = {
    position: { x: number, y: number },
    pressure: number
}

export default class PointerObserver {
    static paramObjects: PointerParamObject[] = []

    static {
        const pushParam = (pointerEvent: PointerEvent) => {
            PointerObserver.paramObjects.push({
                position: {
                    x: pointerEvent.pageX,
                    y: pointerEvent.pageY
                },
                pressure: pointerEvent.pressure
            })
        }

        window.addEventListener('pointerdown', (event) => {
            PointerObserver.paramObjects = []
            pushParam(event)
        }, { capture: true })

        window.addEventListener('pointermove', (event) => {
            PointerObserver.paramObjects = []
            const events = event.getCoalescedEvents()
            events.forEach(e => {
                pushParam(e)
            })
        }, { capture: true })

        window.addEventListener('pointerup', (event) => {
            PointerObserver.paramObjects = []
            pushParam(event)
        }, { capture: true })
    }

    static array(): PointerParamObject[] {
        return PointerObserver.paramObjects
    }

    static last(): PointerParamObject {
        return PointerObserver.paramObjects[PointerObserver.paramObjects.length - 1]
    }
}
