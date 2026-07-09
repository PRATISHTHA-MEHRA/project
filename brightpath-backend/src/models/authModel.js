const db=require("../config/db");

class Auth{

static async login(username){

const query=`
SELECT *
FROM admins
WHERE username=$1
AND status='Active'
`;

const result=await db.query(query,[username]);

return result.rows[0];

}

static async updateLogin(id){

await db.query(

`UPDATE admins
SET last_login=CURRENT_TIMESTAMP
WHERE id=$1`

,[id]);

}

}

module.exports=Auth;