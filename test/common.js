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
    brand: 'visa',
    type: 'Debit',
    created_at: 'now',
    amount: 1200,
    state: "APPROVED",
    tags: {},
    paymentToken: {},
    bin: {},
    payment: {
        merchant: {}
    }

};

export const MOCK_TRANSACT = {
    receipt_number: undefined,
    last_four: 1234,
    brand: 'visa',
    type: 'Debit',
    created_at: 'now',
    amount: 1200,
    state: 'APPROVED',
    tags: {},
}

export const MOCK_JSON_FAIL = {
    id: 'jsonId',
    last_four: 1234,
    brand: 'visa',
    type: 'Debit',
    created_at: 'now',
    amount: 1200,
    state: "error",
    tags: {},
    paymentToken: {},
    bin: {},
    payment: {}

};
