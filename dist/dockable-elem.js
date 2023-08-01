import Docker from './docker.js';
import DockableItem from './dockable-item.js';
export default class DockableElem {
    static docker(elem, option = {}) {
        return new Docker(elem, option);
    }
    static item(elem, option = {}) {
        return new DockableItem(elem, option);
    }
    static dockerAndItem(elem, option = {}) {
        const dockerOption = {
            groups: option.groups
        };
        new Docker(elem, dockerOption);
        Array.from(elem.children).forEach(child => {
            new DockableItem(child, option);
        });
    }
}
//# sourceMappingURL=dockable-elem.js.map