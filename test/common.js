import sinon from 'sinon';

export const api = "pt-sandbox-demo-89f9afeeb9953508186f7cd1a721c269";
export const client = "IDmESP4jtv5BH15NTPdz8SGk";

export const jsonOk = (body) => {
    var mockResponse = new window.Response(JSON.stringify(body), { //the fetch API returns a resolved window Response object
        status: 200,
        headers: {
            'Content-type': 'application/json'
        }
    });

    return Promise.resolve(mockResponse);
}

export const MOCK_JSON = {
    id: 'jsonId',
    last_four: 1234,
    brand: 'visa'
};

export const MOCK_TRANSACT = {
    last_four: 1234,
    brand: 'visa',
    type: undefined,
    receipt_number: undefined,
    state: undefined
}

beforeEach(() => {
    let stub = sinon.stub(window, 'fetch'); //add stub
    stub.onCall(0).returns(jsonOk(MOCK_JSON));
    stub.onCall(1).returns(jsonOk(MOCK_JSON));
});

afterEach(() => {
    window.fetch.restore(); //remove stub
});