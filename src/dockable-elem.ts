import { DockerOption } from './docker-type.js'
import Docker from './docker.js'
import { DockableItemOption } from './dockable-item-type.js'
import DockableItem from './dockable-item.js'

export default class DockableElem {
    static docker(elem: HTMLElement, option: DockerOption = {}) {
        return new Docker(elem, option)
    }

    static item(elem: HTMLElement, option: DockableItemOption = {}) {
        return new DockableItem(elem, option)
    }

    static dockerAndItem(elem: HTMLElement, option: DockableItemOption = {}) {
        const dockerOption = {
            groups: option.groups
        }
        new Docker(elem, dockerOption)
        Array.from(<HTMLCollectionOf<HTMLElement>> elem.children).forEach(child => {
            new DockableItem(child, option)
        })
    }
}
