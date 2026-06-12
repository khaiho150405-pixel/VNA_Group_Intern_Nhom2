import { ConfigService } from '@nestjs/config';
import { JwtModuleOptions } from '@nestjs/jwt';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { join } from 'path';

export const load = () => {
  const env = process.env;
  const port = env.VNA_PORT ? parseInt(env.VNA_PORT, 10) : 3010;
  // let dbConfig = {
  //   host: '194.233.69.122',
  //   port: 5000,
  //   username: 'postgres',
  //   password: '112233',
  //   database: 'ncc',
  // }
  const dbConfig = {
    host: env.VNA_DB_HOST,
    port: parseInt(env.VNA_DB_PORT!, 10),
    username: env.VNA_DB_USER,
    password: env.VNA_DB_PASSWORD,
    database: env.VNA_DB_DATABASE,
  }
  return {
    isProduction: env.NODE_ENV === 'production',
    isDev: env.NODE_ENV === 'development',
    jwt: {
      secret: env.VNA_TOKEN_SECRET_KEY,
      signOptions: { expiresIn: '60d' },
    } as JwtModuleOptions,
    port,
    db: {
      ...dbConfig,
      type: 'postgres',
      // charset: 'utf8_general_ci',
      synchronize: true,
      logging: true,
      keepConnectionAlive: true,
      migrationsTableName: 'migration_typeorm',
      migrationsRun: true,
      autoLoadEntities: true,
      // bigNumberStrings: false,
      // entities: [join(__dirname, './**/*.entity{.ts,.js}')],
      migrations: [join(__dirname, './migrations/*{.ts,.js}')],
      // multipleStatements: true,
    } as TypeOrmModuleOptions,
    s3: {
      accessKeyId: env.VNA_S3_ACCESS_ID,
      secretAccessKey: env.VNA_S3_ACCESS_KEY,
      bucketName: env.VNA_S3_BUCKET,
    },
  };
};

export const dbOptions = async (configService: ConfigService) =>
  configService.get<TypeOrmModuleOptions>('db')!;

export const jwtOptions = async (configService: ConfigService) =>
  configService.get<JwtModuleOptions>('jwt')!;
