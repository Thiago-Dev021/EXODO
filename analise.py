import json

# Carregar o arquivo JSON
with open('data.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Análise básica
total_entradas = len(data)
print(f"Total de entradas: {total_entradas}")

# Categorias únicas
categorias = set()
for item in data:
    categorias.add(item.get('categoria', 'N/A'))

print(f"Categorias únicas: {sorted(categorias)}")

# Verificar duplicatas por nome
nomes = {}
duplicatas = []
for item in data:
    nome = item.get('nome', '')
    if nome in nomes:
        duplicatas.append(nome)
    else:
        nomes[nome] = 1

print(f"Número de nomes duplicados: {len(set(duplicatas))}")
if duplicatas:
    print("Nomes duplicados:", set(duplicatas))

# Contagem por categoria
from collections import Counter
categoria_count = Counter(item.get('categoria', 'N/A') for item in data)
print("Contagem por categoria:")
for cat, count in sorted(categoria_count.items()):
    print(f"  {cat}: {count}")

# Verificar estrutura dos objetos
campos = set()
for item in data:
    campos.update(item.keys())

print(f"Campos presentes nos objetos: {sorted(campos)}")

# Verificar se todos os objetos têm os mesmos campos
todos_campos = {'nome', 'significado', 'referencia', 'descricao', 'categoria'}
faltando = []
for i, item in enumerate(data):
    if not todos_campos.issubset(item.keys()):
        faltando.append(i)

if faltando:
    print(f"Entradas com campos faltando: {faltando}")
else:
    print("Todos os objetos têm os campos obrigatórios.")