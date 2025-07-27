import { PassportStrategy } from "@nestjs/passport";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "../entities/user.entity";
import { Repository } from "typeorm";
import { ConfigService } from "@nestjs/config";
import { ExtractJwt, Strategy } from "passport-jwt";
import { JwtPayload } from "../interfaces/jwt-payload.interface";
import { UnauthorizedException } from "@nestjs/common";




export class JwtStrategy extends PassportStrategy(Strategy) {

    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,

        configService: ConfigService
    ) {
        super({
            secretOrKey: configService.get('JWT_SECRET'),
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken()
        })
    }



    async validate(payload: JwtPayload): Promise<User> {

        const { userId } = payload;
        const user = await this.userRepository.findOne({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                name: true,
                roles: true,
                isActive: true,
                emailVerified: true
            }
        });

        if (!user)
            throw new UnauthorizedException('token no es valido')

        if (!user.isActive)
            throw new UnauthorizedException('Usuario esta inactivo, por favor hablar con el admin');

        return user;

    }








}