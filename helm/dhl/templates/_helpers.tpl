{{- define "dhl.labels" -}}
app.kubernetes.io/name: {{ .Chart.Name }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
helm.sh/chart: {{ .Chart.Name }}-{{ .Chart.Version | replace "+" "_" }}
{{- end }}

{{- define "dhl.image" -}}
{{- $registry := .registry -}}
{{- if $registry }}{{ $registry }}/{{ end }}{{ .repository }}:{{ .tag }}
{{- end }}
