class Docker {
    constructor(elem, option) {
        this.elem = elem;
        this.groups = (option.groups != undefined) ? option.groups : ['shared'];
        this.attach();
    }
    attach() {
        const groupsStr = this.groups.join(Docker.GROUP_NAME_DELIMITER);
        this.elem.setAttribute('docker-groups', groupsStr);
        return this;
    }
    dettach() {
        this.elem.removeAttribute('docker-groups');
        return this;
    }
    addGroups(groups) {
        const groupsAttr = this.elem.getAttribute('docker-groups');
        let currentGroups = (groupsAttr !== '' && groupsAttr !== null) ? groupsAttr.split(Docker.GROUP_NAME_DELIMITER) : [];
        let groupsToAdd = [];
        groups.forEach(group => {
            if (!currentGroups.includes(group)) {
                groupsToAdd.push(group);
            }
        });
        let newGroups = (currentGroups.length > 0) ? currentGroups?.concat(groupsToAdd) : groupsToAdd;
        this.elem.setAttribute('docker-groups', newGroups.join(Docker.GROUP_NAME_DELIMITER));
        return this;
    }
    removeGroups(groups) {
        const groupsAttr = this.elem.getAttribute('docker-groups');
        let currentGroups = (groupsAttr !== '' && groupsAttr !== null) ? groupsAttr.split(Docker.GROUP_NAME_DELIMITER) : [];
        let newGroups = [];
        currentGroups.forEach(group => {
            if (!groups.includes(group)) {
                newGroups.push(group);
            }
        });
        this.elem.setAttribute('docker-groups', newGroups.join(Docker.GROUP_NAME_DELIMITER));
        return this;
    }
}
Docker.GROUP_NAME_DELIMITER = ' ';
export default Docker;
//# sourceMappingURL=docker.js.map