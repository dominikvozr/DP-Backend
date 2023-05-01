export function validateUsername(username:string):string{
    return username.normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "").replace(" ", '-');
}