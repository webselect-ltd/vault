export class CredentialSummary {
    constructor(
        public credentialid: string,
        public masterkey: string,
        public userid: string,
        public description: string,
        public username: string,
        public password: string,
        public url: string,
        public weak: boolean) {
    }
}
