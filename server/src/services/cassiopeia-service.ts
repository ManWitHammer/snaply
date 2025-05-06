import { Cassiopeia } from 'cassiopeia-starlighter'
import 'dotenv/config'

class CassiopeiaService {
    private static instance: Cassiopeia

    public static getInstance(): Cassiopeia {
        if (!CassiopeiaService.instance) {
            CassiopeiaService.instance = new Cassiopeia(
                process.env.CASSIOPEIA_EMAIL!,
                process.env.CASSIOPEIA_PASSWORD!
            )
        }
        return CassiopeiaService.instance
    }
}

export default CassiopeiaService.getInstance()