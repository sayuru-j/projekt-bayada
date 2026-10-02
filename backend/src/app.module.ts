import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'node:path';
import { PrismaModule } from './prisma/prisma.module.js';
import { AuthModule } from './auth/auth.module.js';
import { UsersModule } from './users/users.module.js';
import { PlacesModule } from './places/places.module.js';
import { VisitsModule } from './visits/visits.module.js';
import { AdminModule } from './admin/admin.module.js';
import { UploadsModule } from './uploads/uploads.module.js';
import { LeaderboardModule } from './leaderboard/leaderboard.module.js';
import { CategoriesModule } from './categories/categories.module.js';
import { CommentsModule } from './comments/comments.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    PlacesModule,
    VisitsModule,
    AdminModule,
    UploadsModule,
    LeaderboardModule,
    CategoriesModule,
    CommentsModule,
  ],
})
export class AppModule {}
