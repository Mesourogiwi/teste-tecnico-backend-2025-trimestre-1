# teste-tecnico-backend-2025-trimestre-1
Teste técnico para a posição de Backend Dev. Edição do primeiro trimestre de 2025.

## A proposta: Upload e Streaming de Vídeos + Cache + Docker

A ideia é bem simples:

- [x] uma rota `POST /upload/video` que recebe um **único vídeo** com limite de 10MB e
    - [x] retornando o código de status 400 em caso de arquivo com tipo diferente de vídeo
    - [x] retornando o código de status 400 em caso de arquivo com tamanho maior que 10MB
    - [x] retornando o código de status 204 em caso de sucesso
- [x] uma rota `GET /static/video/:filename` que pode receber um Range por cabeçalho para indicar o offset de streaming
    - [x] retornando o código de status 404 em caso de não existência de um arquivo
    - [x] retornando o conteúdo completo caso nenhum range seja especificado com código de status 200 em caso o arquivo exista no servidor
    - [x] retornando a fatia desejada do conteúdo caso o range seja especificado com código de status 206
    caso o arquivo exista no servidor

Para infra, vamos usar o seguinte conjunto:

- [x] um arquivo `Dockerfile` para fazer o build da imagem a partir da imagem `node:22-alpine`;
- [x] um arquivo `docker-compose.yml` para compor um ambiente com algum serviço de cache de sua escolha.

```plain
A ideia inicial é que os arquivos sejam armazenados dentro do volume do container da aplicação.
Teremos um cache de 60s de TTL para cada arquivo.
O arquivo deve estar disponível antes mesmo de ser persistido no sistema de arquivos.
O arquivo só deve ser lido a partir do sistema de arquivos se não houver cache válido para o mesmo.
```

## Restrições

A única limitação é o uso requerido da runtime `node.js`.

Você tem total liberdade para usar as demais bibliotecas que mais lhe fornecerem produtividade.

Acaso você esteja utilizando este projeto como um meio de estudo, nós o aconselhamos a usar a biblioteca padrão para lidar com requisições web do Node.js, `http`.

## Tempo proposto de conclusão e o que estamos avaliando

Este teste busca avaliar as seguintes competências:

1. Capacidade de uso correto de design patterns;
2. Capacidade de interação com APIs de sistema;
3. Capacidade de desenvolver soluções que usam o conceito de concorrência para extrair maior desempenho do hardware;
4. Domínio sobre a linguagem JavaScript;
5. Domínio sobre a runtime `node.js`;
6. Capacidade de organização de código (Adendo: organize da forma que for mais familiarizado, não estamos olhando para a estrutura de pastas, mas sim para a coesão e o desacoplamento) e
7. Capacidade de lidar com contêineres Docker.

# Comentários do dev ~~

## Solução proposta e escolha de ferramentas

Para resolução desse desafio técnico, acabei utilizando a framework Nestjs. Pensei bastante acerca de utilizar o Express por ser mais simples e permitir uma maior customização no sistema de arquivos em comparação com o Nestjs, já que esse, por sua vez, é bem opinativo, principalmente pelas recipes e gerando uma estrutura pronta. O que também contribuiu para a escolha dessa ferramenta, ela simplifica algumas coisas e trazendo uma estruturação de arquivos baseado em Modules, Services e Controllers, além de acelerar alguns processos de desenvolvimento, por isso a sua escolha. De qualquer forma, usa Express por debaixo dos panos e quando precisei de alguma coisa do Express conseguia fazer isso facilmente.
Para o cache utilizei a ferramenta que já estou acostumado e já é bem conhecida e difundida entre os devs, possuindo um grande apoio da comunidade que é o Redis.
Além disso, a API acabou sendo RESTFul. Outra opção seria o GraphQL pois tem algumas opções de cache embutida, mas acabei optando pela simplicidade do Restful nesse caso.

##Testes e implementação
Para testar a aplicação comecei com a parte de upload utilizando o Insomnia (aqui poderia ser Postman, ThunderClient, Swagger, Curl, etc) por já ter familiaridade com a ferramenta. No primeiro teste fiz o fluxo feliz, subindo um arquivo do tipo mp4 e menor que 10mb:

![image](https://github.com/user-attachments/assets/4ad570d8-0d73-4d48-8b0e-6cc06a017fde)

Resposta 201:

![image](https://github.com/user-attachments/assets/7d4a5d2f-22d5-40c1-ba02-2d0ffc9899cb)

Ao tentar subir um arquivo que não seja vídeo, testei a mensagem de erro:

![image](https://github.com/user-attachments/assets/c36481f2-2c52-4513-a430-cd96d35e860f)

![image](https://github.com/user-attachments/assets/65032e11-b9cb-4b19-a819-00cf964b32aa)

Também testei com um arquivo do tipo vídeo e superior a 10MB:

![image](https://github.com/user-attachments/assets/e2a23d2d-a051-4118-bcd3-865a4f385db1)

![image](https://github.com/user-attachments/assets/d51781a1-abfa-482a-a906-f789fc25242c)

Agora para a parte do get, testei primeiramente o fluxo feliz:

![image](https://github.com/user-attachments/assets/b307e430-3391-4a8c-8df6-4934a71f88b5)

Tivemos o retorno esperado e um código 200.

Nesse caso o insomnia ocultou a resposta pois era grande, mas nesse caso, vamos salvar como um arquivo e visualizar o conteúdo do vídeo, clicando em save file, atribuindo um nome e colocando a extensão .mp4 no final.

Agora vamos testar a fatia do vídeo através do header Range:

![image](https://github.com/user-attachments/assets/a768b67e-3a32-4a86-9818-68c8e8a88b93)

Aqui o Insomnia acabou mostrando o pipe do arquivo pois já é inferior a 5MB.

E podemos verificar que o código é 206, indicando que tivemos um retorno parcial do vídeo.

Vamos dar uma olhada nos headers:

![image](https://github.com/user-attachments/assets/2c0a7b7f-31c6-4d84-a014-b8f7f91f3bd1)

Aqui temos informações relacionadas a length e a parte que foi recortada do arquivo.

Agora eu vou baixar o vídeo cortado e conferir se está de acordo:

![image](https://github.com/user-attachments/assets/af57a671-87be-412c-a657-5a69620b17b6)

![image](https://github.com/user-attachments/assets/08436547-aa40-4d26-9b9f-f8c0a6b2b763)

No caso acima, temos o vídeo inteiro que a API retornou e o primeiro corte que eu fiz e já é perceptível a diferença dos tamanhos. Fiz mais um corte maior pois o primeiro não tinha nem 1s de reprodução por conta da qualidade do vídeo (que apesar de ter 1 minuto e 13 segundos, a qualidade estava puxando o tamanho pra cima).

Também criei os arquivos do dockerfile e o docker-compose.yml.

## Rodando o projeto

Para rodar o projeto, instale as dependências através do comando:

```
npm i
```

Depois simplesmente rode o comando do docker para buildar o container, contendo o projeto e o redis instalado:

```
docker compose up --build
```

## Desafios técnicos
Minha maior dificuldade foi implementar a parte de fatia do vídeo, uma vez que nunca tinha trabalhado com upload/download de vídeos, estou mais acostumado com arquivos do tipo imagem (png, jpg) e pdfs utilizando o serviço de bucket da AWS. Essa é a primeira vez que faço a mesma coisa com vídeos .mp4. Outra parte que nunca tinha visto/usado é a possibilidade de retornar parte do arquivo, tive que estudar como fazia isso pelo header e como era seu parâmetro, além de implementar no backend e ver funcionando.
Nos primeiros testes eu achava que tinha feito alguma coisa errada pois o vídeo simplesmente não rodava e depois percebi que dependendo do corte que é feito no arquivo, perdemos uma informação importante para o mp4 conseguir ser executado e seu conteúdo visualizado, que no caso é o moov presente no começo dos arquivos mp4 que contém os metadados e se o corte é feito de uma forma que esse conteúdo não está presente, o vídeo simplesmente não roda.
