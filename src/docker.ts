import { DockerOption } from './docker-type.js'

export default class Docker {
    static GROUP_NAME_DELIMITER: string = ' '

    elem: HTMLElement
    groups: string[]

    constructor(elem: HTMLElement, option: DockerOption) {
        this.elem = elem
        this.groups = (option.groups != undefined) ? option.groups : ['shared']

        this.attach()
    }

    attach() {
        const groupsStr = this.groups.join(Docker.GROUP_NAME_DELIMITER)
        this.elem.setAttribute('docker-groups', groupsStr)
        return this
    }

    dettach() {
        this.elem.removeAttribute('docker-groups')
        return this
    }

    addGroups(groups: string[]) {
        const groupsAttr = this.elem.getAttribute('docker-groups')
        let currentGroups: string[] = (groupsAttr !== '' && groupsAttr !== null) ? groupsAttr.split(Docker.GROUP_NAME_DELIMITER) : []
        let groupsToAdd: string[] = []
        groups.forEach(group => {
            if (!currentGroups.includes(group)) {
                groupsToAdd.push(group)
            }
        })
        let newGroups: string[] = (currentGroups.length > 0) ? currentGroups?.concat(groupsToAdd) : groupsToAdd
        this.elem.setAttribute('docker-groups', newGroups.join(Docker.GROUP_NAME_DELIMITER))
        return this
    }

    removeGroups(groups: string[]) {
        const groupsAttr = this.elem.getAttribute('docker-groups')
        let currentGroups: string[] = (groupsAttr !== '' && groupsAttr !== null) ? groupsAttr.split(Docker.GROUP_NAME_DELIMITER) : []
        let newGroups: string[] = []
        currentGroups.forEach(group => {
            if (!groups.includes(group)) {
                newGroups.push(group)
            }
        })
        this.elem.setAttribute('docker-groups', newGroups.join(Docker.GROUP_NAME_DELIMITER))
        return this
    }
}
