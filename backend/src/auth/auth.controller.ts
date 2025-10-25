/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { 
  Controller, 
  Post, 
  Body, 
  Get, 
  Patch, 
  UseGuards,
  HttpCode,
  HttpStatus
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth,
  ApiBody
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ 
    summary: 'Register new student account',
    description:
      'Create a new student account. Only students can self-register.',
  })
  @ApiResponse({ 
    status: 201, 
    description: 'User registered successfully'
  })
  @ApiResponse({ 
    status: 409, 
    description: 'Email already registered'
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Validation error'
  })
  @ApiBody({ type: RegisterDto })
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Login to account',
    description: 'Authenticate user and receive JWT access token'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Login successful'
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Invalid credentials or account inactive'
  })
  @ApiBody({ type: LoginDto })
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Get current user profile',
    description: 'Retrieve authenticated user profile information'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Profile retrieved successfully'
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized'
  })
  getProfile(@CurrentUser('id') userId: string) {
    return this.authService.getProfile(userId);
  }

  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Update user profile',
    description: 'Update authenticated user profile information'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Profile updated successfully'
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized'
  })
  updateProfile(
    @CurrentUser('id') userId: string,
    @Body() updateData: Partial<RegisterDto>,
  ) {
    return this.authService.updateProfile(userId, updateData);
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Change password',
    description: 'Change authenticated user password'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Password changed successfully'
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Invalid current password'
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized'
  })
  @ApiBody({ type: ChangePasswordDto })
  changePassword(
    @CurrentUser('id') userId: string,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(userId, changePasswordDto);
  }

  @Post('refresh')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Refresh access token',
    description: 'Generate new access token for authenticated user'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Token refreshed successfully'
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized'
  })
  refreshToken(@CurrentUser('id') userId: string) {
    return this.authService.refreshToken(userId);
  }

  @Get('validate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Validate token',
    description: 'Check if current token is valid'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Token is valid'
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Token is invalid'
  })
  validateToken(@CurrentUser() user: any) {
    return {
      valid: true,
      user,
      message: 'Token is valid',
    };
  }
}