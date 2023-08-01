var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _DockableItem_instances, _DockableItem_styleForDrag, _DockableItem_styleForFreePosition, _DockableItem_styleForDock, _DockableItem_followPointer, _DockableItem_getHoveredRelatedElemsObj, _DockableItem_startDrag, _DockableItem_dragging, _DockableItem_finishDrag, _DockableItem_createGhost, _DockableItem_swapWithGhost, _DockableItem_updateGhost, _DockableItem_dragEvent;
import PointerObserver from './pointer-observer.js';
import ElemSmoothPlacer from './elem-smooth-placer.js';
class DockableItem {
    constructor(elem, option) {
        _DockableItem_instances.add(this);
        this.dragStartPosition = {
            x: null,
            y: null
        };
        this.prevHoveredParam = {
            position: null,
            docker: null,
            dockableItem: null
        };
        this.ghost = null;
        this.elem = elem;
        this.groups = (option.groups != undefined) ? option.groups : ['shared'];
        this.handles = (option.handleClass != undefined) ? Array.from(this.elem.getElementsByClassName(option.handleClass)) : [this.elem];
        this.freePosition = (option.freePosition != undefined) ? option.freePosition : true;
        this.isDragEnabled = (option.draggable != undefined) ? option.draggable : true;
        this.isDockEnabled = (option.dockable != undefined) ? option.dockable : true;
        this.isTransitionEnabled = (option.transition?.enabled != undefined) ? option.transition.enabled : false;
        this.transitionDuration = (option.transition?.duration != undefined) ? option.transition.duration : 150;
        this.transitionClass = (option.transition?.class != undefined) ? option.transition.class : 'dockable_elem-transition';
        this.attach();
    }
    attach() {
        this.handles.forEach(handle => {
            handle.addEventListener('pointerdown', __classPrivateFieldGet(this, _DockableItem_instances, "m", _DockableItem_dragEvent).bind(this));
        });
    }
    dettach() {
        this.handles.forEach(handle => {
            handle.removeEventListener('pointerdown', __classPrivateFieldGet(this, _DockableItem_instances, "m", _DockableItem_dragEvent).bind(this));
        });
    }
    addGroups(groups) {
        this.groups = this.groups.concat(groups);
        this.groups = Array.from(new Set(this.groups));
        return this;
    }
    removeGroups(groups) {
        this.groups = this.groups.filter(group => !groups.includes(group));
        return this;
    }
}
_DockableItem_instances = new WeakSet(), _DockableItem_styleForDrag = function _DockableItem_styleForDrag() {
    this.elem.style.position = 'absolute';
    this.elem.classList.add(DockableItem.DEFAULT_CLASS_DRAGGING);
    this.elem.classList.remove(DockableItem.DEFAULT_CLASS_FREE_POSITION);
    this.elem.classList.remove(DockableItem.DEFAULT_CLASS_DOCKING);
}, _DockableItem_styleForFreePosition = function _DockableItem_styleForFreePosition() {
    this.elem.style.position = 'absolute';
    this.elem.classList.remove(DockableItem.DEFAULT_CLASS_DRAGGING);
    this.elem.classList.add(DockableItem.DEFAULT_CLASS_FREE_POSITION);
    this.elem.classList.remove(DockableItem.DEFAULT_CLASS_DOCKING);
}, _DockableItem_styleForDock = function _DockableItem_styleForDock() {
    this.elem.style.position = '';
    this.elem.style.left = '';
    this.elem.style.top = '';
    this.elem.classList.remove(DockableItem.DEFAULT_CLASS_DRAGGING);
    this.elem.classList.remove(DockableItem.DEFAULT_CLASS_FREE_POSITION);
    this.elem.classList.add(DockableItem.DEFAULT_CLASS_DOCKING);
}, _DockableItem_followPointer = function _DockableItem_followPointer() {
    const pointer = PointerObserver.last();
    this.elem.style.position = 'absolute';
    this.elem.style.left = pointer.position.x - this.dragStartPosition.x + 'px';
    this.elem.style.top = pointer.position.y - this.dragStartPosition.y + 'px';
}, _DockableItem_getHoveredRelatedElemsObj = function _DockableItem_getHoveredRelatedElemsObj() {
    let hoveredElemsObj = {
        docker: null,
        dockableItems: [],
        ghost: null
    };
    const pointer = PointerObserver.last();
    const hoveredElems = document.elementsFromPoint(pointer.position.x, pointer.position.y);
    // ポインター下の同グループドッカーを1件抽出
    hoveredElemsObj.docker = hoveredElems.find(elem => {
        if (!elem.hasAttribute('docker-groups'))
            return false;
        const dockerGroups = elem.getAttribute('docker-groups').split(DockableItem.GROUP_NAME_DELIMITER);
        let exists = false;
        this.groups.forEach(groupName => {
            if (dockerGroups.includes(groupName)) {
                exists = true;
                return;
            }
        });
        return exists;
    }) ?? null;
    if (hoveredElemsObj.docker !== null) {
        // ポインター下の同グループドッカーの子要素を抽出
        hoveredElemsObj.dockableItems = hoveredElems.filter(elem => {
            if (elem.classList.contains(DockableItem.DEFAULT_CLASS_GHOST))
                return false;
            if (elem.style.position === 'absolute')
                return false;
            if (elem === this.elem)
                return false;
            let exists = false;
            if (elem.parentElement === hoveredElemsObj.docker) {
                exists = true;
            }
            return exists;
        });
        // ポインター下のゴースト要素を抽出
        hoveredElemsObj.ghost = hoveredElems.find(elem => elem.classList.contains(DockableItem.DEFAULT_CLASS_GHOST)) ?? null;
    }
    return hoveredElemsObj;
}, _DockableItem_startDrag = function _DockableItem_startDrag(event) {
    __classPrivateFieldGet(this, _DockableItem_instances, "m", _DockableItem_styleForDrag).call(this);
    const rect = this.elem.getBoundingClientRect();
    this.dragStartPosition = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
    };
    const hoveredElemsObj = __classPrivateFieldGet(this, _DockableItem_instances, "m", _DockableItem_getHoveredRelatedElemsObj).call(this);
    this.prevHoveredParam = {
        position: null,
        docker: hoveredElemsObj.docker,
        dockableItem: (hoveredElemsObj.dockableItems.length > 0) ? hoveredElemsObj.dockableItems[0] : null
    };
}, _DockableItem_dragging = function _DockableItem_dragging() {
    __classPrivateFieldGet(this, _DockableItem_instances, "m", _DockableItem_followPointer).call(this);
    if (this.isDockEnabled)
        __classPrivateFieldGet(this, _DockableItem_instances, "m", _DockableItem_updateGhost).call(this);
}, _DockableItem_finishDrag = function _DockableItem_finishDrag() {
    if (this.ghost !== null) {
        __classPrivateFieldGet(this, _DockableItem_instances, "m", _DockableItem_swapWithGhost).call(this);
    }
    else if (this.freePosition) {
        __classPrivateFieldGet(this, _DockableItem_instances, "m", _DockableItem_styleForFreePosition).call(this);
    }
    else {
        __classPrivateFieldGet(this, _DockableItem_instances, "m", _DockableItem_styleForDock).call(this);
    }
}, _DockableItem_createGhost = function _DockableItem_createGhost() {
    const rect = this.elem.getBoundingClientRect();
    const elem = document.createElement('div');
    elem.classList.add(DockableItem.DEFAULT_CLASS_GHOST);
    elem.style.width = rect.width + 'px';
    elem.style.height = rect.height + 'px';
    return elem;
}, _DockableItem_swapWithGhost = function _DockableItem_swapWithGhost() {
    if (this.ghost !== null) {
        __classPrivateFieldGet(this, _DockableItem_instances, "m", _DockableItem_styleForDock).call(this);
        this.ghost.insertAdjacentElement('afterend', this.elem);
        this.ghost.remove();
        this.ghost = null;
    }
}, _DockableItem_updateGhost = function _DockableItem_updateGhost() {
    const hoveredElemsObj = __classPrivateFieldGet(this, _DockableItem_instances, "m", _DockableItem_getHoveredRelatedElemsObj).call(this);
    if (hoveredElemsObj.ghost !== null) { // ポインター下がゴーストの場合
        // nop
        return;
    }
    if (hoveredElemsObj.docker === null) { // ポインター下がドッカー外の場合
        if (this.ghost !== null) {
            if (this.isTransitionEnabled) {
                ElemSmoothPlacer.remove({
                    from: this.ghost,
                    duration: this.transitionDuration
                });
            }
            else {
                this.ghost.remove();
            }
        }
        this.ghost = null;
        this.prevHoveredParam = {
            position: null,
            docker: hoveredElemsObj.docker,
            dockableItem: null
        };
        return;
    }
    if (hoveredElemsObj.dockableItems.length === 0) { // ポインター下にドック可能要素が存在しない場合
        if (hoveredElemsObj.docker !== null) { // ポインター下がドッカーのみの場合
            // ドッカー内の最後にゴーストを挿入
            if (this.ghost === null) {
                this.ghost = __classPrivateFieldGet(this, _DockableItem_instances, "m", _DockableItem_createGhost).call(this);
                hoveredElemsObj.docker.insertAdjacentElement('beforeend', this.ghost);
            }
        }
        return;
    }
    // ポインター下にドッカーとその子要素が存在する場合、ゴーストを挿入
    const dockableItem = hoveredElemsObj.dockableItems[0];
    const hoverdPosition = (() => {
        const pointer = PointerObserver.last();
        const from = {
            x: pointer.position.x + window.scrollX,
            y: pointer.position.y + window.scrollY
        };
        const itemRect = dockableItem.getBoundingClientRect();
        const toTop = {
            left: itemRect.left,
            top: itemRect.top,
            right: itemRect.right,
            bottom: itemRect.top + (itemRect.height / 2)
        };
        const toBottom = {
            left: itemRect.left,
            top: itemRect.top + (itemRect.height / 2),
            right: itemRect.right,
            bottom: itemRect.bottom
        };
        if (toTop.left <= from.x && from.x <= toTop.right && toTop.top <= from.y && from.y <= toTop.bottom) {
            return 'top';
        }
        else if (toBottom.left <= from.x && from.x <= toBottom.right && toBottom.top <= from.y && from.y <= toBottom.bottom) {
            return 'bottom';
        }
        return null;
    })();
    if (hoverdPosition !== null) {
        const hoveredParam = {
            position: hoverdPosition,
            docker: hoveredElemsObj.docker,
            dockableItem: dockableItem
        };
        const isHoveredParamChanged = (hoveredParam.position !== this.prevHoveredParam.position
            || hoveredParam.docker !== this.prevHoveredParam.docker
            || hoveredParam.dockableItem !== this.prevHoveredParam.dockableItem);
        if (isHoveredParamChanged) {
            if (this.ghost === null) {
                this.ghost = __classPrivateFieldGet(this, _DockableItem_instances, "m", _DockableItem_createGhost).call(this);
                if (hoveredParam.docker === this.prevHoveredParam.docker) {
                    // ドッカー内で要素のドラッグを開始した場合、トランジションなしでゴーストを挿入
                    if (hoverdPosition === 'top') {
                        dockableItem.insertAdjacentElement('beforebegin', this.ghost);
                    }
                    else if (hoverdPosition === 'after') {
                        dockableItem.insertAdjacentElement('afterend', this.ghost);
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
                            });
                        }
                        else {
                            dockableItem.insertAdjacentElement('beforebegin', this.ghost);
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
                            });
                        }
                        else {
                            dockableItem.insertAdjacentElement('afterend', this.ghost);
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
                        });
                    }
                    else {
                        dockableItem.insertAdjacentElement('beforebegin', this.ghost);
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
                        });
                    }
                    else {
                        dockableItem.insertAdjacentElement('afterend', this.ghost);
                    }
                }
            }
        }
        this.prevHoveredParam = hoveredParam;
    }
}, _DockableItem_dragEvent = function _DockableItem_dragEvent(event) {
    if (!this.isDragEnabled)
        return;
    // ドラッグ開始時
    this.elem.dispatchEvent(DockableItem.EVENT_DRAG_START);
    __classPrivateFieldGet(this, _DockableItem_instances, "m", _DockableItem_startDrag).call(this, event);
    __classPrivateFieldGet(this, _DockableItem_instances, "m", _DockableItem_dragging).call(this);
    // ドラッグ中
    const drag = () => {
        this.elem.dispatchEvent(DockableItem.EVENT_DRAGGING);
        __classPrivateFieldGet(this, _DockableItem_instances, "m", _DockableItem_dragging).call(this);
    };
    window.addEventListener('pointermove', drag);
    // ドラッグ終了時
    window.addEventListener('pointerup', () => {
        this.elem.dispatchEvent(DockableItem.EVENT_DRAG_END);
        __classPrivateFieldGet(this, _DockableItem_instances, "m", _DockableItem_finishDrag).call(this);
        window.removeEventListener('pointermove', drag);
    }, { once: true });
};
DockableItem.GROUP_NAME_DELIMITER = ' ';
DockableItem.DEFAULT_CLASS_DRAGGING = 'dockable_elem-dragging';
DockableItem.DEFAULT_CLASS_FREE_POSITION = 'dockable_elem-free_position';
DockableItem.DEFAULT_CLASS_DOCKING = 'dockable_elem-docking';
DockableItem.DEFAULT_CLASS_GHOST = 'dockable_elem-ghost';
DockableItem.EVENT_DRAG_START = new MouseEvent('dockable_elem-dragstart');
DockableItem.EVENT_DRAGGING = new MouseEvent('dockable_elem-dragging');
DockableItem.EVENT_DRAG_END = new MouseEvent('dockable_elem-dragend');
export default DockableItem;
//# sourceMappingURL=dockable-item.js.map