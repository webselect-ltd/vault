import '../legacy/passpack-v1.1.js';
import { ICredential, IPasswordSpecification } from '../types/all';

const encoder = new TextEncoder();
const decoder = new TextDecoder();

async function aesGcmEncrypt(plaintext: string, password: string) {
    const pwUtf8 = encoder.encode(password);                                 // encode password as UTF-8
    const pwHash = await crypto.subtle.digest('SHA-256', pwUtf8);                      // hash the password

    const iv = crypto.getRandomValues(new Uint8Array(12));                             // get 96-bit random iv

    const algorithm: AesGcmParams = {
        name: 'AES-GCM',
        iv: iv
    };

    const key = await crypto.subtle.importKey('raw', pwHash, algorithm.name, false, ['encrypt']); // generate key from pw

    const ptUint8 = encoder.encode(plaintext);                               // encode plaintext as UTF-8
    const ctBuffer = await crypto.subtle.encrypt(algorithm, key, ptUint8);                   // encrypt plaintext using key

    const ctArray = Array.from(new Uint8Array(ctBuffer));                              // ciphertext as byte array
    const ctStr = ctArray.map(byte => String.fromCharCode(byte)).join('');             // ciphertext as string
    const ctBase64 = btoa(ctStr);                                                      // encode ciphertext as base64

    const ivHex = Array.from(iv).map(b => ('00' + b.toString(16)).slice(-2)).join(''); // iv as hex string

    return ivHex + ctBase64;                                                             // return iv+ciphertext
}

async function aesGcmDecrypt(ciphertext: string, password: string) {
    const pwUtf8 = encoder.encode(password);                                  // encode password as UTF-8
    const pwHash = await crypto.subtle.digest('SHA-256', pwUtf8);                       // hash the password

    const iv = ciphertext.slice(0, 24).match(/.{2}/g).map(byte => parseInt(byte, 16));   // get iv from ciphertext

    const algorithm: AesGcmParams = {
        name: 'AES-GCM',
        iv: new Uint8Array(iv)
    };

    const key = await crypto.subtle.importKey('raw', pwHash, algorithm.name, false, ['decrypt']);  // use pw to generate key

    const ctStr = atob(ciphertext.slice(24));                                           // decode base64 ciphertext
    const ctUint8 = new Uint8Array(ctStr.match(/[\s\S]/g).map(ch => ch.charCodeAt(0))); // ciphertext as Uint8Array

    const plainBuffer = await crypto.subtle.decrypt(algorithm, key, ctUint8);                 // decrypt ciphertext using key
    const plaintext = decoder.decode(plainBuffer);                            // decode password from UTF-8

    return plaintext;                                                                   // return the plaintext
}

// Bit value below which password is deemed weak
export const weakPasswordThreshold = 40;

export function getPasswordBits(password: string) {
    return Passpack.utils.getBits(password);
}

export function hex(buffer: ArrayBuffer) {
    return Array.from(new Uint8Array(buffer)).map(b => ('0' + b.toString(16)).slice(-2)).join('');
}

export function plain(buffer: ArrayBuffer) {
    return decoder.decode(buffer);
}

export async function hash(s: string) {
    return await crypto.subtle.digest('SHA-256', encoder.encode(s));
}

export function generatePassword(specification: IPasswordSpecification) {
    if (specification.length === 0) {
        return null;
    }

    if (specification.lowercase === false
        && specification.uppercase === false
        && specification.numbers === false
        && specification.symbols === false) {
        return null;
    }

    const options: IPasspackCharOptions = {};

    if (specification.lowercase) {
        options.lcase = 1;
    }

    if (specification.uppercase) {
        options.ucase = 1;
    }

    if (specification.numbers) {
        options.nums = 1;
    }

    if (specification.symbols) {
        options.symb = 1;
    }

    return Passpack.utils.passGenerator(options, specification.length);
}

export async function generateMasterKey(password: string) {
    const inner = await hash(password);
    const outer = await hash(password + plain(inner));
    return plain(outer);
}

export async function decryptCredential(credential: ICredential, masterKey: string, excludes: string[]) {
    return forPropertiesOf(credential, async val => await aesGcmDecrypt(val, masterKey), excludes);
}

export async function decryptCredentials(credentials: ICredential[], masterKey: string, excludes: string[]) {
    return await Promise.all(credentials.map(async item => await decryptCredential(item, masterKey, excludes)));
}

export async function encryptCredential(credential: ICredential, masterKey: string, excludes: string[]) {
    return forPropertiesOf(credential, async val => await aesGcmEncrypt(val, masterKey), excludes);
}

export async function encryptCredentials(credentials: ICredential[], masterKey: string, excludes: string[]) {
    return await Promise.all(credentials.map(async item => await encryptCredential(item, masterKey, excludes)));
}

export function isWeakPassword(password: string) {
    if (!password) {
        return true;
    }
    return getPasswordBits(password) <= weakPasswordThreshold;
}

async function forPropertiesOf(credential: ICredential, action: (val: string) => Promise<string>, excludes: string[]) {
    const encrypted: any = {};

    const properties = Object.keys(credential);

    const isExcluded = (k: string) => excludes.indexOf(k) !== -1;
    const isNotExcluded = (k: string) => !isExcluded(k);

    // Map the excluded properties directly
    properties.filter(isExcluded).forEach(k => encrypted[k] = credential[k]);

    const encryptedMappings = properties.filter(isNotExcluded)
        .map(async k => { encrypted[k] = await action(credential[k]); });

    await Promise.all(encryptedMappings);

    return (encrypted as ICredential);
}
