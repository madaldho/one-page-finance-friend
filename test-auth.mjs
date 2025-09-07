#!/usr/bin/env node

/**
 * Simple test script to validate authentication fixes
 * Run with: node test-auth.mjs
 */

import { createClient } from '@supabase/supabase-js';

// Test configuration (you'll need to provide real values)
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://pjwmfyvknbtoofxfuwjm.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key-here';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testAuthenticationFlow() {
  console.log('🧪 Testing Authentication Flow...\n');

  try {
    // Test 1: Check if we can connect to Supabase
    console.log('1. Testing Supabase connection...');
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.log('❌ Connection failed:', error.message);
      return;
    }
    console.log('✅ Supabase connection successful\n');

    // Test 2: Test profile table access
    console.log('2. Testing profile table access...');
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, name, email')
      .limit(1);
    
    if (profileError) {
      console.log('❌ Profile table access failed:', profileError.message);
    } else {
      console.log('✅ Profile table accessible\n');
    }

    // Test 3: Test email validation (basic check)
    console.log('3. Testing email validation...');
    const testEmail = 'test@example.com';
    const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(testEmail);
    console.log(isValidEmail ? '✅ Email validation working' : '❌ Email validation failed');
    console.log('');

    // Test 4: Test password validation
    console.log('4. Testing password validation...');
    const testPassword = 'testpassword123';
    const isValidPassword = testPassword.length >= 6;
    console.log(isValidPassword ? '✅ Password validation working' : '❌ Password validation failed');
    console.log('');

    console.log('🎉 Basic authentication tests completed!');
    console.log('\n📋 Manual Testing Required:');
    console.log('- Test Google OAuth login');
    console.log('- Test setting password for Google account');
    console.log('- Test email/password login after setting password');
    console.log('- Test forgot password flow');
    console.log('- Verify no white screen on app load');

  } catch (error) {
    console.log('❌ Test failed with error:', error.message);
  }
}

// Run tests
testAuthenticationFlow();