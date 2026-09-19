$rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()

function New-Secret([int]$length = 64) {
  $bytes = New-Object byte[] ($length)
  $rng.GetBytes($bytes)
  $encoded = [Convert]::ToBase64String($bytes).Replace("+", "-").Replace("/", "_").Replace("=", "")
  return $encoded.Substring(0, [Math]::Min($length, $encoded.Length))
}

Write-Output ("JWT_SECRET=" + (New-Secret))
Write-Output ("TRACKER_TOKEN_SECRET=" + (New-Secret))
Write-Output ("JUDGE_INTERNAL_TOKEN=" + (New-Secret))
