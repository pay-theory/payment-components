const styles = {
	default: '',
	success:'',
	error:''
}

const defaultOptions = {
    placeholder: 'name',
    styles: {
        default: styles.default,
        success: styles.success, 
        error: styles.error
    }
}

const accountName = (secureProvider = 'https://dev.secure-fields.paytheorystudy.com', options = defaultOptions) => {
	const config = window.btoa(JSON.stringify(options))
	const framed = document.createElement("iframe")
	const src = document.createAttribute("src")
	src.value = `${secureProvider}/account-name/${encodeURI(config)}`
	framed.setAttributeNode(src)				
	return framed
}
	


export { accountName } 