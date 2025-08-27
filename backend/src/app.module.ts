import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { ProductsModule } from './products/products.module';
import { CategoriesModule } from './categories/categories.module';
import { ImageKitModule } from './imagekit/imagekit.module';
import { CartModule } from './cart/cart.module';
import { OrdersModule } from './orders/orders.module';
import { WhatsAppModule } from './whatsapp/whatsapp.module';
import { ClerkWebhookModule } from './clerk/clerk.webhook.module';
import { AddressesModule } from './addresses/addresses.module';
import { WishlistModule } from './wishlist/wishlist.module';
import { DesignsModule } from './designs/designs.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    DatabaseModule,
    AuthModule,
    ProductsModule,
    CategoriesModule,
    ImageKitModule,
    CartModule,
    OrdersModule,
    WhatsAppModule,
    ClerkWebhookModule,
    AddressesModule,
    WishlistModule,
    DesignsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
