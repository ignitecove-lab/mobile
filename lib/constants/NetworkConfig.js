import API_BASE_URL  from './baseUrl';

export const createOptions = (endpoint, method, body) => {
    return {
        url: `${API_BASE_URL}/${endpoint}`,
        trusty: true,  // for self-signed certificates
        ciphers: ['ECDHE-RSA-AES128-GCM-SHA256'],  // Accepted cipher list
        timeout: 5000,  // request will time out in 5 seconds
        sslPinning: {
            certs: ["ignite_cove_cert"]  // the name of the certificate file placed in `res/raw`
        },
        method,
        headers: {
            'Content-Type' : 'application/json',
        },
        body: JSON.stringify(body),
    };
};