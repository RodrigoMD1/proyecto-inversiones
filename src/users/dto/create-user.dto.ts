import { IsEmail, IsNotEmpty, IsString, Matches, MaxLength, MinLength } from 'class-validator';



export class CreateUserDto {
    @IsNotEmpty()
    @IsString()
    @IsEmail()
    email: string;

    @IsNotEmpty()
    @MinLength(1)
    name: string;

    @MinLength(6)
    @IsNotEmpty()
    @MaxLength(40)
    @Matches(
        /(?:(?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
        message: 'la contraseña debe tener una letra mayuscula , una letra minuscula y un numero :) '
    })
    password: string;

}