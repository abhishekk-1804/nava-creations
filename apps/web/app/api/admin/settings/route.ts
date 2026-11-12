import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/auth';
import { SettingsService } from '@/lib/settings-service';
import { ValidationError } from '@nava/shared';

export async function GET(request: NextRequest) {
  const session = await verifyAdminSession(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const settings = await SettingsService.getSettings();
  return NextResponse.json({ success: true, settings });
}

export async function PATCH(request: NextRequest) {
  const session = await verifyAdminSession(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const updated = await SettingsService.updateSettings(body);
    return NextResponse.json({
      success: true,
      settings: updated,
      message: 'Studio settings updated successfully.',
    });
  } catch (err: unknown) {
    if (err instanceof ValidationError) {
      return NextResponse.json({ error: 'Validation failed', message: err.message }, { status: 422 });
    }
    const message = err instanceof Error ? err.message : 'Failed to update settings';
    return NextResponse.json({ error: 'Failed to update settings', message }, { status: 400 });
  }
}
