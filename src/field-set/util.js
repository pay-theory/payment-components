const postData = async(url = '', apiKey, data = {}) {
    const options = {
        method: 'POST',
        mode: 'cors',
        cache: 'no-cache',
        headers: {
            'x-api-key': apiKey,
            'content-type': 'application/json',
        },
        redirect: 'follow',
        referrerPolicy: 'no-referrer',
        body: JSON.stringify(data),
    };
    /* global fetch */
    const response = await fetch(url, options);
    return await response.json();
}

const addFrame = (
    form,
    container,
    element,
    styles,
    frameType = 'paytheory-credit-card-tag-frame',
) => {
    const tagFrame = document.createElement(frameType);
    tagFrame.styles = styles;
    tagFrame.form = form;
    tagFrame.setAttribute('ready', true);
    tagFrame.setAttribute('id', `${element}-tag-frame`);
    container.appendChild(tagFrame);
}


const processElement = (form, element, styles) => {
    if (typeof element !== 'string') throw new Error('invalid element');
    const container = document.getElementById(element);
    if (container) {
        const contained = document.getElementById(`${element}-tag-frame`);
        if (contained === null) {
            addFrame(form, container, element, styles, `${element}-tag-frame`);
        }
        else {
            console.log(`${element} is already mounted`, contained);
            throw new Error(`${element} is already mounted`);
        }
    }
    else {
        throw new Error(`${element} is not available in dom`);
    }
}

const processElements = (form, elements, styles) => {
    let processed = []
    elements.forEach(element => {
        if (typeof element !== 'string') throw new Error('invalid element')
        const container = document.getElementById(element)
        if (container) {
            const contained = document.getElementById(`${element}-tag-frame`)
            if (contained === null) {
                addFrame(form, container, element, styles, `${element}-tag-frame`)
                processed.push(element)
            }
            else {
                console.log(`${element} is already mounted`, contained);
                throw new Error(`${element} is already mounted`);
            }
        }
        else {
            console.log(`${element} is not available in dom`);
        }
    })
    return processed
}

const invalidate = _t => (_t.isDirty ? _t.errorMessages.length > 0 : undefined);

export { postData, addFrame, processElement, processElements, invalidate }
