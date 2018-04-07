type PasspackCryptoFunction = (algorithm: string, text: string, key: string, pars?: any) => string;

declare class PasspackCharMatrix {
    public lcase: number[];
    public ucase: number[];
    public nums: number[];
    public symb: number[];
    public space: number[];
}

interface IPasspackCharOptions {
    lcase?: number;
    ucase?: number;
    nums?: number;
    symb?: number;
    space?: number;
}

interface IPasspackUtils {
    charMatrix: PasspackCharMatrix;
    getBits(passphrase: string): number;
    passGenerator(chars: IPasspackCharOptions, n: number): string;
    simplePassGenerator(n: number): string;
    genRandomKey(x: number, salt: string): string;
    getArrayFromHexString(hexstr: string, n: number): number[];
    hashx(str: string, nohex?: boolean, full?: boolean): string;
    getStringFromHex(str: string, n: number): string;
}

interface IPasspack {
    decode: PasspackCryptoFunction;
    encode: PasspackCryptoFunction;
    utils: IPasspackUtils;
}

declare const Passpack: IPasspack;
