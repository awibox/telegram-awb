const Utils = {
    // --------------------------------
    //  Parse a url and break it into resource, id and verb
    // --------------------------------
    parseRequestURL: () => {

        let url = location.hash.slice(1).toLowerCase() || '/';
        let r = url.split("/");
        let request = {
            resource: null,
            id: null,
            verb: null
        };
        request.resource = r[1];
        request.id = r[2];
        request.verb = r[3];

        return request;
    },

    isObject(obj) {
        return obj === Object(obj);
    },

    // Restricts input for the given textbox to the given inputFilter function.
    setInputFilter(textbox, inputFilter) {
        ["input", "keydown", "keyup", "mousedown", "mouseup", "select", "contextmenu"].forEach(function (event) {
            textbox.oldValue = "";
            textbox.addEventListener(event, function () {
                if (inputFilter(this.value)) {
                    this.oldValue = this.value;
                    this.oldSelectionStart = this.selectionStart;
                    this.oldSelectionEnd = this.selectionEnd;
                } else if (this.hasOwnProperty("oldValue")) {
                    this.value = this.oldValue;
                    this.setSelectionRange(this.oldSelectionStart, this.oldSelectionEnd);
                }
            });
        });
    }
};

export default Utils;