import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'Nenhum arquivo foi enviado' },
        { status: 400 }
      );
    }

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      return NextResponse.json(
        { error: 'Configuração do Cloudinary não encontrada' },
        { status: 500 }
      );
    }

    const timestamp = Math.round(new Date().getTime() / 1000);
    const folder = 'vslix-videos';

    const signature = await generateSignature(timestamp, folder, apiSecret);

    const uploadFormData = new FormData();
    uploadFormData.append('file', file);
    uploadFormData.append('timestamp', timestamp.toString());
    uploadFormData.append('api_key', apiKey);
    uploadFormData.append('signature', signature);
    uploadFormData.append('folder', folder);
    uploadFormData.append('resource_type', 'video');

    const uploadResponse = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`,
      {
        method: 'POST',
        body: uploadFormData,
      }
    );

    if (!uploadResponse.ok) {
      let errorMessage = 'Erro ao fazer upload para o Cloudinary';
      try {
        const errorData = await uploadResponse.json();
        console.error('Cloudinary error:', errorData);
        errorMessage = errorData.error?.message || errorMessage;
      } catch (e) {
        const errorText = await uploadResponse.text();
        console.error('Cloudinary error text:', errorText);
      }
      return NextResponse.json(
        { error: errorMessage },
        { status: 500 }
      );
    }

    const uploadData = await uploadResponse.json();

    return NextResponse.json({
      success: true,
      url: uploadData.secure_url,
      publicId: uploadData.public_id,
      duration: uploadData.duration,
      format: uploadData.format,
      width: uploadData.width,
      height: uploadData.height,
      bytes: uploadData.bytes,
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao processar upload' },
      { status: 500 }
    );
  }
}

async function generateSignature(
  timestamp: number,
  folder: string,
  apiSecret: string
): Promise<string> {
  const paramsToSign = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;

  const encoder = new TextEncoder();
  const data = encoder.encode(paramsToSign);
  const hashBuffer = await crypto.subtle.digest('SHA-1', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  return hashHex;
}
