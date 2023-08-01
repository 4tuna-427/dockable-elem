export type DockableItemOption = {
    groups?: string[],
    handleClass?: string,
    freePosition?: boolean,
    draggable?: boolean,
    dockable?: boolean
    class?: {
        dragging?: string,
        freePosition?: string,
        docking?: string,
        ghost?: string
    },
    transition?: {
        enabled?: boolean,
        duration?: number,
        class?: string
    }
}
