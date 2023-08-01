import DockableElem from './dockable-elem.js';
// ドッカー
const leftColumnElem = document.getElementById('my-left_column');
DockableElem.docker(leftColumnElem);
const rightColumnElem = document.getElementById('my-right_column');
DockableElem.docker(rightColumnElem);
// ドック可能要素
const dockableElems = Array.from(document.getElementsByClassName('my-tool_window'));
dockableElems.forEach(elem => {
    DockableElem.item(elem, {
        handleClass: 'my-tool_window-handle',
        freePosition: true,
        transition: {
            enabled: true,
            duration: 100
        }
    });
});
//# sourceMappingURL=main.js.map