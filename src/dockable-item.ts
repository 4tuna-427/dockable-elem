import { DockableItemOption } from './dockable-item-type.js'
import PointerObserver from './pointer-observer.js'
import ElemSmoothPlacer from './elem-smooth-placer.js'

type Point = {
    x: number,
    y: number
}
type Rect = {
    left: number,
    top: number,
    right: number,
    bottom: number
}

export default class DockableItem {
    static GROUP_NAME_DELIMITER: string = ' '
    static DEFAULT_CLASS_DRAGGING: string = 'dockable_elem-dragging'
    static DEFAULT_CLASS_FREE_POSITION: string = 'dockable_elem-free_position'
    static DEFAULT_CLASS_DOCKING: string = 'dockable_elem-docking'
    static DEFAULT_CLASS_GHOST: string = 'dockable_elem-ghost'
    static EVENT_DRAG_START: MouseEvent = new MouseEvent('dockable_elem-dragstart')
    static EVENT_DRAGGING: MouseEvent = new MouseEvent('dockable_elem-dragging')
    static EVENT_DRAG_END: MouseEvent = new MouseEvent('dockable_elem-dragend')

    elem: HTMLElement
    groups: string[]
    handles: HTMLElement[]
    freePosition: boolean
    isDragEnabled: boolean
    isDockEnabled: boolean
    isTransitionEnabled: boolean
    transitionDuration: number
    transitionClass: string

    dragStartPosition: { x: number | null, y: number | null } = {
        x: null,
        y: null
    }
    prevHoveredParam: { position: string | null, docker: HTMLElement | null, dockableItem: HTMLElement | null } = {
        position: null,
        docker: null,
        dockableItem: null
    }
    ghost: HTMLElement | null = null

    constructor(elem: HTMLElement, option: DockableItemOption) {
        this.elem = elem
        this.groups = (option.groups != undefined) ? option.groups : ['shared']
        this.handles = (option.handleClass != undefined) ? Array.from(<HTMLCollectionOf<HTMLElement>> this.elem.getElementsByClassName(option.handleClass)) : [this.elem]
        this.freePosition = (option.freePosition != undefined) ? option.freePosition : true
        this.isDragEnabled = (option.draggable != undefined) ? option.draggable : true
        this.isDockEnabled = (option.dockable != undefined) ? option.dockable : true
        this.isTransitionEnabled = (option.transition?.enabled != undefined) ? option.transition.enabled : false
        this.transitionDuration = (option.transition?.duration != undefined) ? option.transition.duration : 150
        this.transitionClass = (option.transition?.class != undefined) ? option.transition.class : 'dockable_elem-transition'

        this.attach()
    }

    #styleForDrag() {
        this.elem.style.position = 'absolute'
        this.elem.classList.add(DockableItem.DEFAULT_CLASS_DRAGGING)
        this.elem.classList.remove(DockableItem.DEFAULT_CLASS_FREE_POSITION)
        this.elem.classList.remove(DockableItem.DEFAULT_CLASS_DOCKING)
    }

    #styleForFreePosition() {
        this.elem.style.position = 'absolute'
        this.elem.classList.remove(DockableItem.DEFAULT_CLASS_DRAGGING)
        this.elem.classList.add(DockableItem.DEFAULT_CLASS_FREE_POSITION)
        this.elem.classList.remove(DockableItem.DEFAULT_CLASS_DOCKING)
    }

    #styleForDock() {
        this.elem.style.position = ''
        this.elem.style.left = ''
        this.elem.style.top = ''
        this.elem.classList.remove(DockableItem.DEFAULT_CLASS_DRAGGING)
        this.elem.classList.remove(DockableItem.DEFAULT_CLASS_FREE_POSITION)
        this.elem.classList.add(DockableItem.DEFAULT_CLASS_DOCKING)
    }

    #followPointer() {
        const pointer = PointerObserver.last()
        this.elem.style.position = 'absolute'
        this.elem.style.left = pointer.position.x - this.dragStartPosition.x! + 'px'
        this.elem.style.top  = pointer.position.y - this.dragStartPosition.y! + 'px'
    }

    #getHoveredRelatedElemsObj() {
        let hoveredElemsObj: { docker: HTMLElement | null, dockableItems: HTMLElement[] | null, ghost: HTMLElement | null } = {
            docker: null,
            dockableItems: [],
            ghost: null
        }
        const pointer = PointerObserver.last()
        const hoveredElems: HTMLElement[] = <HTMLElement[]>document.elementsFromPoint(pointer.position.x, pointer.position.y)
        // ポインター下の同グループドッカーを1件抽出
        hoveredElemsObj.docker = hoveredElems.find(elem => {
            if (!elem.hasAttribute('docker-groups')) return false
            const dockerGroups = elem.getAttribute('docker-groups')!.split(DockableItem.GROUP_NAME_DELIMITER)
            let exists = false
            this.groups.forEach(groupName => {
                if (dockerGroups.includes(groupName)) {
                    exists = true
                    return
                }
            })
            return exists
        }) ?? null
        if (hoveredElemsObj.docker !== null) {
            // ポインター下の同グループドッカーの子要素を抽出
            hoveredElemsObj.dockableItems = hoveredElems.filter(elem => {
                if (elem.classList.contains(DockableItem.DEFAULT_CLASS_GHOST)) return false
                if (elem.style.position === 'absolute') return false
                if (elem === this.elem) return false
                let exists = false
                if (elem.parentElement === hoveredElemsObj.docker) {
                    exists = true
                }
                return exists
            })
            // ポインター下のゴースト要素を抽出
            hoveredElemsObj.ghost = hoveredElems.find(elem => elem.classList.contains(DockableItem.DEFAULT_CLASS_GHOST)) ?? null
        }
        return hoveredElemsObj
    }

    #startDrag(event: PointerEvent) {
        this.#styleForDrag()
        const rect = this.elem.getBoundingClientRect()
        this.dragStartPosition = {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top
        }
        const hoveredElemsObj = this.#getHoveredRelatedElemsObj()
        this.prevHoveredParam = {
            position: null,
            docker: hoveredElemsObj.docker,
            dockableItem: (hoveredElemsObj.dockableItems!.length > 0) ? hoveredElemsObj.dockableItems![0] : null
        }
    }

    #dragging() {
        this.#followPointer()
        if (this.isDockEnabled) this.#updateGhost()
    }

    #finishDrag() {
        if (this.ghost !== null) {
            this.#swapWithGhost()
        }
        else if (this.freePosition) {
            this.#styleForFreePosition()
        }
        else {
            this.#styleForDock()
        }
    }

    #createGhost() {
        const rect = this.elem.getBoundingClientRect()
        const elem = document.createElement('div')
        elem.classList.add(DockableItem.DEFAULT_CLASS_GHOST)
        elem.style.width = rect.width + 'px'
        elem.style.height = rect.height + 'px'
        return elem
    }

    #swapWithGhost() {
        if (this.ghost !== null) {
            this.#styleForDock()
            this.ghost!.insertAdjacentElement('afterend', this.elem)
            this.ghost!.remove()
            this.ghost = null
        }
    }

    #updateGhost() {
        const hoveredElemsObj = this.#getHoveredRelatedElemsObj()

        if (hoveredElemsObj.ghost !== null) {  // ポインター下がゴーストの場合
            // nop
            return
        }
        if (hoveredElemsObj.docker === null) {  // ポインター下がドッカー外の場合
            if (this.ghost !== null) {
                if (this.isTransitionEnabled) {
                    ElemSmoothPlacer.remove({
                        from: this.ghost!,
                        duration: this.transitionDuration
                    })
                }
                else {
                    this.ghost.remove()
                }
            }
            this.ghost = null
            this.prevHoveredParam = {
                position: null,
                docker: hoveredElemsObj.docker,
                dockableItem: null
            }
            return
        }
        if (hoveredElemsObj.dockableItems!.length === 0) {  // ポインター下にドック可能要素が存在しない場合
            if (hoveredElemsObj.docker !== null) {  // ポインター下がドッカーのみの場合
                // ドッカー内の最後にゴーストを挿入
                if (this.ghost === null) {
                    this.ghost = this.#createGhost()
                    hoveredElemsObj.docker.insertAdjacentElement('beforeend', this.ghost)
                }
            }
            return
        }
        // ポインター下にドッカーとその子要素が存在する場合、ゴーストを挿入
        const dockableItem: HTMLElement = hoveredElemsObj.dockableItems![0]
        const hoverdPosition: string | null = (() => {
            const pointer = PointerObserver.last()
            const from: Point = {
                x: pointer.position.x + window.scrollX,
                y: pointer.position.y + window.scrollY
            }
            const itemRect = dockableItem.getBoundingClientRect()
            const toTop: Rect = {
                left: itemRect.left,
                top: itemRect.top,
                right: itemRect.right,
                bottom: itemRect.top + (itemRect.height / 2)
            }
            const toBottom = {
                left: itemRect.left,
                top: itemRect.top + (itemRect.height / 2),
                right: itemRect.right,
                bottom: itemRect.bottom
            }
            if (toTop.left <= from.x && from.x <= toTop.right && toTop.top <= from.y && from.y <= toTop.bottom) {
                return 'top'
            }
            else if (toBottom.left <= from.x && from.x <= toBottom.right && toBottom.top <= from.y && from.y <= toBottom.bottom) {
                return 'bottom'
            }
            return null
        })()
        if (hoverdPosition !== null) {
            const hoveredParam = {
                position: hoverdPosition,
                docker: hoveredElemsObj.docker,
                dockableItem: dockableItem
            }
            const isHoveredParamChanged = (
                hoveredParam.position !== this.prevHoveredParam.position
                || hoveredParam.docker !== this.prevHoveredParam.docker
                || hoveredParam.dockableItem !== this.prevHoveredParam.dockableItem
            )
            if (isHoveredParamChanged) {
                if (this.ghost === null) {
                    this.ghost = this.#createGhost()
                    if (hoveredParam.docker === this.prevHoveredParam.docker) {
                        // ドッカー内で要素のドラッグを開始した場合、トランジションなしでゴーストを挿入
                        if (hoverdPosition === 'top') {
                            dockableItem.insertAdjacentElement('beforebegin', this.ghost)
                        }
                        else if (hoverdPosition === 'after') {
                            dockableItem.insertAdjacentElement('afterend', this.ghost)
                        }
                    }
                    else {
                        // ドッカー外から要素をドラッグしてきた場合、トランジションありでゴーストを挿入
                        if (hoverdPosition === 'top') {
                            if (this.isTransitionEnabled) {
                                ElemSmoothPlacer.insert({
                                    from: this.ghost,
                                    to: dockableItem,
                                    position: 'before',
                                    duration: this.transitionDuration,
                                    class: {
                                        all: this.transitionClass
                                    }
                                })
                            }
                            else {
                                dockableItem.insertAdjacentElement('beforebegin', this.ghost)
                            }
                        }
                        else if (hoverdPosition === 'bottom') {
                            if (this.isTransitionEnabled) {
                                ElemSmoothPlacer.insert({
                                    from: this.ghost,
                                    to: dockableItem,
                                    position: 'after',
                                    duration: this.transitionDuration,
                                    class: {
                                        all: this.transitionClass
                                    }
                                })
                            }
                            else {
                                dockableItem.insertAdjacentElement('afterend', this.ghost)
                            }
                        }
                    }
                }
                else {
                    if (hoverdPosition === 'top') {
                        if (this.isTransitionEnabled) {
                            ElemSmoothPlacer.insert({
                                from: this.ghost,
                                to: dockableItem,
                                position: 'before',
                                duration: this.transitionDuration,
                                class: {
                                    all: this.transitionClass
                                }
                            })
                        }
                        else {
                            dockableItem.insertAdjacentElement('beforebegin', this.ghost)
                        }
                    }
                    else if (hoverdPosition === 'bottom') {
                        if (this.isTransitionEnabled) {
                            ElemSmoothPlacer.insert({
                                from: this.ghost,
                                to: dockableItem,
                                position: 'after',
                                duration: this.transitionDuration,
                                class: {
                                    all: this.transitionClass
                                }
                            })
                        }
                        else {
                            dockableItem.insertAdjacentElement('afterend', this.ghost)
                        }
                    }
                }
            }
            this.prevHoveredParam = hoveredParam
        }
    }

    #dragEvent(event: PointerEvent) {
        if (!this.isDragEnabled) return
        // ドラッグ開始時
        this.elem.dispatchEvent(DockableItem.EVENT_DRAG_START)
        this.#startDrag(event)
        this.#dragging()

        // ドラッグ中
        const drag = () => {
            this.elem.dispatchEvent(DockableItem.EVENT_DRAGGING)
            this.#dragging()
        }
        window.addEventListener('pointermove', drag)

        // ドラッグ終了時
        window.addEventListener('pointerup', () => {
            this.elem.dispatchEvent(DockableItem.EVENT_DRAG_END)
            this.#finishDrag()
            window.removeEventListener('pointermove', drag)
        }, { once: true })
    }

    attach() {
        this.handles.forEach(handle => {
            handle.addEventListener('pointerdown', this.#dragEvent.bind(this))
        })
    }

    dettach() {
        this.handles.forEach(handle => {
            handle.removeEventListener('pointerdown', this.#dragEvent.bind(this))
        })
    }

    addGroups(groups: string[]) {
        this.groups = this.groups.concat(groups)
        this.groups = Array.from(new Set(this.groups))
        return this
    }

    removeGroups(groups: string[]) {
        this.groups = this.groups.filter(group => !groups.includes(group))
        return this
    }
}
