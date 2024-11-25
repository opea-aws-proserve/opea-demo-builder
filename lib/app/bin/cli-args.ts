export interface CliArgFlags {
    [name:string]: any
}

export type CliArgArgs = (string | number)[]

export interface CliArgParams {
    flags: CliArgFlags
    args: CliArgArgs
}

export interface CommandConfig extends CliArgParams {
    command: string
}

export default class CliArgs {

    static Get(...params: CliArgArgs): CliArgParams {
        if (!params.length) {
            params = process.argv;
            params.shift();
            params.shift();
        }

        const flags: CliArgFlags = {};
        const args: CliArgArgs = [];
        let currentFlag: string | undefined = undefined;

        for (let i = 0; i < params.length; i++) {
            let param = params[i];
            if (typeof param === 'number') param = param.toString();
            if (param.startsWith('-')) {
                if (currentFlag) {
                    const cf = currentFlag.split('=');
                    flags[cf[0]] = cf[1] ? CliArgs.NormalizeParam(cf[1]) : true;
                }
                currentFlag = param.replace(/^\-*/, '');
            } else {
                if (currentFlag) {
                    const cfl = currentFlag.split('=');
                    if (cfl[1]) {
                        flags[cfl[0]] = CliArgs.NormalizeParam(cfl[1]);
                        args.push(param);
                    } else {
                        flags[cfl[0]] = CliArgs.NormalizeParam(param);
                    }
                } else {
                    args.push(param);
                }
                currentFlag = undefined;
            }
        }
        if (currentFlag) {
            const cfm = currentFlag.split('=');
            flags[cfm[0]] = cfm[1] ? CliArgs.NormalizeParam(cfm[1]) : true;
            currentFlag = undefined;
        }
        return {flags,args}; 
    }

    static GetCommand(...params:CliArgArgs): CommandConfig {
        if (!params.length) params = process.argv;
        if (
            (typeof params[0] === 'string' && params[0] == process.argv[0]) 
            &&
            (typeof params[1] === 'string' && params[1] == process.argv[1]) 
        ) params.splice(0,2);
        const command = params.shift();
        if (!command) throw new Error("No command found");
        if (typeof command === 'number') throw new Error("Command cannot be a number");
        const { flags, args } = CliArgs.Get(...params);
        return {command,flags,args};
    }

    static NormalizeParam(param:string | number): any {
        if (typeof param === 'number') return param;
        try {
            const res = JSON.parse(param);
            return res;
        } catch(e) {
            return param;
        }
    } 

    static DenormalizeParam(param:any): string {
        try {
            const res = JSON.stringify(param);
            return res;
        } catch(e) {
            return param;
        }
    } 
}
