import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const componentsUiPath = path.join(process.cwd(), 'src', 'components', 'ui');
    const libUtilsPath = path.join(process.cwd(), 'src', 'lib', 'utils');
    
    const uiFiles = fs.existsSync(componentsUiPath) 
      ? fs.readdirSync(componentsUiPath) 
      : ['DIR_NOT_EXISTS'];
      
    const utilsFiles = fs.existsSync(libUtilsPath)
      ? fs.readdirSync(libUtilsPath)
      : ['DIR_NOT_EXISTS'];
    
    return NextResponse.json({
      cwd: process.cwd(),
      'src/components/ui': uiFiles,
      'src/lib/utils': utilsFiles,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      stack: error.stack,
    }, { status: 500 });
  }
}

