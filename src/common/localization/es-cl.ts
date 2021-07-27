// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { IAppStrings } from "../strings";

/*eslint-disable no-template-curly-in-string, no-multi-str*/

/**
 * App Strings for Spanish language
 */
export const spanish: IAppStrings = {
    appName: "Herramienta de prueba de formulario OCR",
    projectService: {
        existingLabelFiles: "ficheros de etiquetas existentes",
    },
    common: {
        displayName: "Nombre para Mostrar",
        description: "Descripción",
        submit: "Enviar",
        cancel: "Cancelar",
        save: "Guardar",
        delete: "Borrar",
        provider: "Proveedor",
        homePage: "Página de Inicio",
        reload: "Recargar",
        skipToMainContent: "Saltar al contenido principal",
        skipToSidebar: "Saltar a la barra lateral",
    },
    titleBar: {
        help: "Ayuda",
        minimize: "Minimizar",
        maximize: "Maximizar",
        restore: "Restaurar",
        close: "Cerrar",
    },
    homePage: {
        title: "Página de Inicio",
        newProject: "Nuevo Proyecto",
        recentProjects: "Proyectos Recientes",
        openLocalProject: {
            title: "Abrir Proyecto Local",
            description: "Abrir Proyecto Local",
        },
        openCloudProject: {
            title: "Abrir Proyecto de la Nube",
            selectConnection: "Proyecto de nube abierta",
            pasteSharedUri: "Pegue la cadena de proyecto compartida aquí",
        },
        deleteProject: {
            title: "Borrar Proyecto",
            confirmation: "¿Está seguro de que quiere borrar el proyecto",
        },
        importProject: {
            title: "Importar Proyecto",
            confirmation: "¿Está seguro que quiere convertir el proyecto ${project.file.name} " +
                "a formato v2? Le recomendamos de que haga una copia de seguridad de su archivo de proyecto.",
        },
        messages: {
            deleteSuccess: "${project.name} eliminado correctamente",
        },
        homeProjectView: {
            title: "Utilice Personalizado para entrenar un modelo con etiquetas y obtener pares clave-valor"
        },
        prebuiltPredict: {
            title: "Utilice un modelo prediseñado para obtener datos",
            description: "Comience con un modelo preconstruidos para extraer datos de sus formularios: facturas, recibos, tarjetas de visita y mucho más. Envíe sus datos y obtenga resultados de inmediato."
        },
        layoutPredict: {
            title: "Utilice Layout para obtener texto, tablas y marcas de selección",
            description: "Pruebe el servicio Diseño del reconocedor de formularios para extraer texto, tablas, marcas de selección y la estructura del documento."
        },
        trainWithLabels: {
            title: "Utilice Personalizado para entrenar un modelo con etiquetas y obtener pares clave-valor",
            description: "Tú proporcionas tus propios datos de entrenamiento y haces el aprendizaje. El modelo que cree puede adaptarse a los formularios específicos de su industria."
        },
        quickStartGuide: "Quick start guide",
    },
    appSettings: {
        title: "Configuración de Aplicación",
        storageTitle: "Configuración de Almacenamiento",
        uiHelp: "Donde se guardan sus configuraciones",
        save: "Guardar configuración",
        securityToken: {
            name: {
                title: "Nombre",
            },
            key: {
                title: "Clave",
            },
            duplicateNameErrorMessage: "El nombre del token debe ser único para todos los tokens",
        },
        securityTokens: {
            title: "Tokens de seguridad",
            description: "Los tokens de seguridad se utilizan para cifrar datos confidenciales \
                dentro de la configuración del proyecto",
        },
        version: {
            description: "Versión:",
        },
        commit: "Commit SHA",
        devTools: {
            description: "Abrir herramientas de desarrollo de aplicaciones para ayudar a diagnosticar problemas.",
            button: "Alternar Herramientas de Desarrollo",
        },
        reload: {
            description: "Recargar la aplicación descartando todos los cambios actuales",
            button: "Recargar la aplicación",
        },
        messages: {
            saveSuccess: "Configuración de la aplicación guardada correctamente",
        },
    },
    projectSettings: {
        title: "Configuración de Proyecto",
        securityToken: {
            title: "Token de seguridad",
            description: "Se utiliza para cifrar datos confidenciales dentro de archivos de proyecto",
        },
        save: "Guardar el Proyecto",
        sourceConnection: {
            title: "Conexión de Origen",
            description: "De donde se cargan sus recursos",
        },
        targetConnection: {
            title: "Conexión de Destino",
            description: "Donde se guarda su proyecto y sus datos exportados",
        },
        videoSettings: {
            title: "Ajustes de video",
            description: "La velocidad a la que se extraen los marcos para el etiquetado.",
            frameExtractionRate: "Tasa de extracción de cuadros (cuadros por segundo de video)",
        },
        addConnection: "Agregar Conexión",
        messages: {
            saveSuccess: "Guardado correctamente ${project.name} configuración del proyecto",
            projectExisted: "Un proyecto con el nombre ${project.name} ya existe, por favor utilice otro nombre.",
        },
    },
    train: {
        modelNameTitle: "Nombre del modelo",
        labelFolderTitle: "URI de carpeta de etiquetas",
        defaultLabelFolderURL: "/shared",
        title: "Entrenar",
        training: "Entrenamiento",
        pleaseWait: "Por favor espera",
        notTrainedYet: "Aún no entrenado",
        backEndNotAvailable: "La función de casilla de verificación funcionará en la versión futura del servicio de reconocimiento de formularios, manténgase atento.",
        addName: "Agregar nombre de modelo ...",
        downloadJson: "Descargar archivo JSON",
        trainConfirm: {
            title: "Etiquetas aún no revisadas",
            message: "Hay archivos recién etiquetados automáticamente aún no revisados por usted, ¿quiere entrenar con esos archivos?"
        },
        errors: {
            electron: {
                cantAccessFiles: "No se puede acceder a los archivos en '${folderUri}' para entrenamiento. Compruebe si el URI de la carpeta especificada es correcto."
            }
        }
    },
    modelCompose: {
        title: "Modelo componer",
        columnAria: {
            icon: "Modelo con icono es un nuevo modelo compuesto",
        },
        loading: "Cargando modelos...",
        composing: "La modelo está componiendo, por favor espera ...",
        limitQuantityComposedModel:"Los recursos gratuitos del identificador de formularios soportan hasta cinco modelos en un modelo compuesto.Por favor, actualice a recursos pagados",
        column: {
            icon: {
                name: "Icono compuesto",
            },
            id: {
                headerName: "ID del Modelo",
                fieldName: "modelId",
            },
            name: {
                headerName: "Nombre del Modelo",
                fieldName: "modelName",
            },
            status: {
                headerName: "Estado",
                fieldName: "status",
            },
            created: {
                headerName: "Creada",
                fieldName: "created",
            },
            lastUpdated: {
                headerName: "Última Actualización",
                fieldName: "lastUpdated",
            },
        },
        modelView: {
            titleAria: "Componer vista de modelo",
            addComposeModelName: "Añadir componer el nombre de modelo ...",
            NotEnoughModels: "Debe tener más de un modelo seleccionado para componer un nuevo modelo",
            modelsCannotBeIncluded: "Advertencia: ¡estos modelos no se incluirán en el modelo compuesto!",
            modelCannotBeIncluded: "Advertencia: ¡Este modelo no se incluirá en el modelo compuesto!",
            addModelToRecentModels: "Modelo [${modelID}] agregado a modelos recientes",
            recentModelsAlreadyContainsModel: "Los modelos recientes ya contienen el modelo [${modelID}]",
            loadingDetails: "Cargando detalles del modelo ..."
        },
        commandBar: {
            ariaLabel: "Utilice la barra de comandos para componer modelos",
            composeAria: "Componer modelo",
            refreshAria: "Actualizar la lista",
            filter: "Filtrar por nombre ...",
            filterAria: "Filtrar por área de entrada de nombre"
        },
        modelsList: {
            headerAria: "Lista de encabezado de modelos",
            checkButtonAria: "Seleccionar botón de verificación del modelo",
            checkAllButtonAria: "Botón de verificación Seleccionar todos los modelos",
        },
        errors: {
            failedCompose: "¡Algo salió mal, el modelo compuesto no fue creado!",
            noInfoAboutModel: "ℹ️  Modelo original no encontrado. No hay información disponible.",
        }
    },
    predict: {
        title: "Analizar",
        uploadFile: "Elija una imagen para analizar con",
        inProgress: "Análisis en curso...",
        noRecentModels: "Este proyecto no tiene modelos recientes. Entrenar o componer un nuevo modelo para analizar.",
        selectModelHeader: "Modelo para analizar con",
        modelIDPrefix: "ID del modelo: ",
        modelNamePrefix: "Nombre del modelo: ",
        downloadScript: "Analizar con script python",
        defaultLocalFileInput: "Busca un archivo...",
        defaultURLInput: "Pegar o escribir URL...",
        editAndUploadToTrainingSet: "Editar y cargar al conjunto de entrenamiento",
        editAndUploadToTrainingSetNotify: "Al hacer clic en este botón, este formulario se agregará al Blob de Azure Storage para este proyecto, donde puede editar estas etiquetas.",
        editAndUploadToTrainingSetNotify2: "Estamos agregando este archivo a su conjunto de entrenamiento, donde puede editar las etiquetas y volver a entrenar el modelo.",
        uploadInPrgoress: "carga en curso...",
        analysis: "Análisis",
        runAnalysis: "Ejecutar análisis",
        confirmDuplicatedAssetName: {
            title: "El nombre del activo existe",
            message: "El activo con el nombre '${name}' existe en el proyecto, ¿anularlo?"
        }
    },
    pageRange: {
        title: "Rango de páginas:",
        tooltip: "Especifique el número de página o el rango de números de página para procesar, por ejemplo: 1, 5, 7, 9-10"
    },
    prebuiltPredict: {
        title: "Análisis preconstruido",
        defaultLocalFileInput: "Busca un archivo...",
        defaultURLInput: "Pegar o escribir URL...",
        uploadFile: "Elija una imagen para analizar con",
        inProgress: "Análisis en curso...",
        anlayWithPrebuiltModels: "Análisis ${name}",
        locale: "Lugar",
        formTypeTitle: "Tipo de formulario",
        selectFileAndRunAnalysis: "Seleccionar archivo y ejecutar análisis",
        analysis: "Análisis",
        runAnalysis: "Ejecutar análisis",
        noFieldCanBeExtracted: "No se puede extraer ningún campo.",
        pdfPageNumberLimit:'El recurso identificador de formulario de capa libre sólo procesa las primeras 2 páginas del PDF'
    },
    documentFilePicker: {
        source: "Fuente",
        localFile: "Archivo local",
        url: "URL"
    },
    prebuiltSetting: {
        serviceConfigurationTitle: "Configuración del servicio",
        serviceEndpointTitle: "Dirección del servicio del reconocedor de formularios",
        apiKeyTitle: "Clave API",
        endpointTooltip: "Establecer la dirección de la API ej: https://xxx.cognitiveservices.azure.com/",
        endpointPlaceholder: "necesita la dirección de la API",
        apiKeyTooltip: "Obtener información clave de la página de claves de recursos y terminales de suscripción de Azure",
        apiKeyPlaceholder: "necesita apiKey"
    },
    layoutPredict: {
        layout: "Diseño",
        title: "Análisis de diseño",
        inProgress: "Análisis en curso...",
        selectFileAndRunLayout: "Seleccionar archivo y ejecutar diseño",
        analysis: "Análisis",
        runLayout: "Ejecutar diseño",
        download: "Descargar",
        layoutResults: "Resultados de diseño"
    },
    recentModelsView: {
        header: "Seleccionar modelo para analizar con",
        checkboxAriaLabel: "Seleccione la casilla de verificación del modelo",
        addToRecentModels: "Seleccionar para analizar con"
    },
    projectMetrics: {
        title: "Métricas del proyecto",
        assetsSectionTitle: "Recursos",
        totalAssetCount: "Total de recursos",
        visitedAssets: "Recursos visitados (${count})",
        taggedAssets: "Recursos etiquetados (${count})",
        nonTaggedAssets: "Recursos no etiquetados (${count})",
        nonVisitedAssets: "Recursos no visitados (${count})",
        tagsSectionTitle: "Etiquetas & etiquetas",
        totalRegionCount: "Total de regiones",
        totalTagCount: "Total de etiquetas",
        avgTagCountPerAsset: "Recuento promedio de etiquetas por activo",
    },
    tags: {
        title: "Etiquetas",
        placeholder: "Agregar nueva etiqueta",
        editor: "Editor de Etiquetas",
        modal: {
            name: "Nombre de Etiqueta",
            color: "Color de Etiqueta",
        },
        colors: {
            white: "Blanco",
            gray: "Gris",
            red: "Rojo",
            maroon: "Granate",
            yellow: "Amarillo",
            olive: "Olivo",
            lime: "Lima",
            green: "Verde",
            aqua: "Aguamarina",
            teal: "Azul Verdoso",
            blue: "Azul",
            navy: "Azul Marino",
            fuschia: "Fucsia",
            purple: "Púrpura",
        },
        warnings: {
            existingName: "Nombre de etiqueta ya existe. Elige otro nombre",
            emptyName: "El nombre de etiqueta no puede ser vacío",
            unknownTagName: "Desconocido",
            notCompatibleTagType: "El tipo de etiqueta no es compatible con esta función. Si desea cambiar el tipo de esta etiqueta, elimine o reasigne todas las etiquetas que utilizan esta etiqueta en su proyecto.",
            checkboxPerTagLimit: "No se puede asignar más de una casilla de verificación por etiqueta",
            notCompatibleWithDrawnRegionTag: "Los valores de drawnRegion y ${otherCategory} no pueden asignarse a la misma etiqueta del documento",
            replaceAllExitingLabels: "¿Está seguro de que desea reemplazar las etiquetas de la etiqueta seleccionada?",
            replaceAllExitingLabelsTitle: "Reemplazar las etiquetas de la etiqueta",
        },
        preText: {
            autoLabel: "Auto-etiquetado: ",
            revised: "Revisado: ",
        },
        regionTableTags: {
            configureTag: {
                errors: {
                    atLeastOneColumn: "Asigne al menos una columna.",
                    atLeastOneRow: "Asigne al menos una fila.",
                    checkFields: "Verifique si completó todos los campos obligatorios correctamente.",
                    assignTagName: "El nombre de la etiqueta no puede estar vacío.",
                    notUniqueTagName: "El nombre de la etiqueta debe ser único",
                    emptyTagName: "Asigne un nombre para la etiqueta de su mesa.",
                    emptyName: "El nombre no puede estar vacío",
                    notUniqueName: "El nombre debe ser único",
                    notCompatibleTableColOrRowType: "El tipo $ {kind} no es compatible con este tipo. Si desea cambiar el tipo de este $ {kind}, elimine o asigne todas las etiquetas que usan este $ {kind} en su proyecto."
                }
            },
            tableLabeling: {
                title: "Tabla de etiquetas",
                tableName: "Nombre de la tabla",
                description: {
                    title: "Para comenzar a etiquetar su tabla:",
                    stepOne: "Seleccione las palabras del documento que desea etiquetar",
                    stepTwo: "Haga clic en la celda de la tabla a la que desea etiquetar las palabras seleccionadas",
                },
                buttons: {
                    done: "Hecho",
                    reconfigureTable: "Reconfigurar la tabla",
                    addRow: "Añadir fila"
                }
            },
            confirm: {
                reconfigure: {
                    title: "Reconfigurar etiqueta",
                    message: "¿Está seguro de que desea volver a configurar esta etiqueta?\n Se volverá a configurar para todos los documentos.",
                }
            }

        },
        toolbar: {
            addTable: "Agregar nueva etiqueta",
            add: "Agregar nueva etiqueta",
            onlyShowCurrentPageTags: "Mostrar solo las etiquetas utilizadas en la página actual",
            showAllTags: "Mostrar todas las etiquetas",
            showOriginLabels: "Mostrar etiquetas de origen",
            hideOriginLabels: "Ocultar etiquetas de origen",
            contextualMenu: "Menú contextual",
            delete: "Borrar etiqueta",
            edit: "Editar etiqueta",
            format: "Seleccionar formato",
            lock: "Bloquear etiqueta",
            moveDown: "Mover etiqueta hacia abajo",
            moveUp: "Mover etiqueta hacia arriba",
            rename: "Renombrar etiqueta",
            search: "Buscar entre etiquetas",
            type: "Seleccione tipo",
            vertiline: "Linea vertical",
        },
    },
    connections: {
        title: "Conexiones",
        new: "Nueva conexión",
        save: "Guardar Conexión",
        genericInvalid: "\"${project.sourceConnection.name}\" es una conexión no válida. Por favor verifíquelo en la página Conexiones",
        details: "Detalles de Conexión",
        settings: "Configuración de Conexión",
        instructions: "Por favor seleccione una conexión para editar",
        messages: {
            saveSuccess: "${connection.name} guardado correctamente",
            deleteSuccess: "${connection.name} eliminado correctamente",
            doNotAllowDuplicateNames: "La conexión con el nombre \"${connection.name}\" ya existe. Por favor, use otro nombre"
        },
        imageCorsWarning: "Advertencia: Cuando se usa VoTT en un navegador web, es posible que algunos recursos de este \
                          Búsqueda de Imágenes Bing no se exporten correctamente debido a las restricciones de CORS \
                          (Recursos de Origen Cruzado).",
        blobCorsWarning: "Advertencia: CORS (Recursos de Origen Cruzado) debe estar habilitado en la \
                          cuenta de Azure Blob Storage para poder usarlo como una conexión de origen o destino. Puede \
                          encontrar más información sobre cómo habilitar CORS en la {0}.",
        azDocLinkText: "documentación de Azure.",
        providers: {
            azureBlob: {
                title: "Azure blob container",
                description: "",
                accountName: {
                    title: "Nombre de cuenta",
                    description: "",
                },
                containerName: {
                    title: "Nombre del contenedor",
                    description: "",
                },
                sas: {
                    title: "SAS",
                    description: "Firma de acceso compartido utilizada para autenticarse en la cuenta de BLOB Storage",
                },
                createContainer: {
                    title: "Crear contenedor",
                    description: "Crea el contenedor de blobs si aún no existe",
                },
                invalidSASMessage: "Verifique si dispone de permisos de leer/escribir/listar/borrar para el contenedor/blob.",
            },
            bing: {
                title: "Búsqueda de Imágenes Bing",
                options: "Opciones de Búsqueda de Imágenes Bing",
                apiKey: "Clave API",
                query: "Consulta",
                aspectRatio: {
                    title: "Relación de Aspecto",
                    all: "Todos",
                    square: "Cuadrado",
                    wide: "Ancho",
                    tall: "Alto",
                },
            },
            local: {
                title: "Sistema de Archivos Local",
                folderPath: "Ruta de la carpeta",
                browse: "vistazo",
                selectFolder: "Seleccionar la carpeta",
                chooseFolder: "Elijir la carpeta",
                invalidFolderMessage: "La conexión [${project.sourceConnection.providerOptions.folderPath}] y la carpeta del proyecto [${project.folderPath}] no son válidas. Compruebe las carpetas especificadas en las páginas Configuración de conexión y proyecto",
            },
        },
    },
    editorPage: {
        title: "Editor",
        width: "Ancho",
        height: "Alto",
        tagged: "Etiquetado",
        visited: "Visitado",
        toolbar: {
            select: "Seleccionar",
            pan: "Pan",
            drawRectangle: "Dibujar Rectángulo",
            drawPolygon: "Dibujar Polígono",
            copyRectangle: "Copia rectángulo",
            copy: "Copiar regiones",
            cut: "Cortar regiones",
            paste: "Pegar regiones",
            removeAllRegions: "Eliminar Todas Las Regiones",
            previousAsset: "Activo anterior",
            nextAsset: "Siguiente activo",
            saveProject: "Guardar Proyecto",
            exportProject: "Exprtar Proyecto",
            activeLearning: "Aprendizaje Activo",
        },
        videoPlayer: {
            previousTaggedFrame: {
                tooltip: "Fotograma etiquetado anterior",
            },
            nextTaggedFrame: {
                tooltip: "Siguiente marco etiquetado",
            },
            previousExpectedFrame: {
                tooltip: "Fotograma anterior",
            },
            nextExpectedFrame: {
                tooltip: "Siguiente marco",
            },
        },
        help: {
            title: "Abrir/cerrar el menú de ayuda",
            escape: "Escapar el menú de ayuda",
        },
        asset: {
            delete: {
                title: "Eliminar documento",
                confirmation: "Estás seguro de que quieres eliminar ",
            }
        },
        assetWarning: {
            incorrectFileExtension: {
                attention: "¡Atención!",
                text: "-- la extensión de este archivo no corresponde al tipo MIME. Por favor revise el archivo:",
                failedToFetch: "No se pudo recuperar ${fileName} para la validación del tipo de mímica",
            },
        },
        assetError: "No se puede mostrar el activo",
        tags: {
            hotKey: {
                apply: "Aplicar etiqueta con tecla de acceso rápido",
                lock: "Bloquear etiqueta con tecla de acceso rápido",
            },
            rename: {
                title: "Cambiar el nombre de la etiqueta",
                confirmation: "¿Está seguro de que quiere cambiar el nombre de esta etiqueta? \
                Será cambiada en todos los recursos",
            },
            delete: {
                title: "Delete Tag",
                confirmation: "¿Está seguro de que quiere borrar esta etiqueta? Será borrada en todos \
                los recursos y en las regiones donde esta etiqueta sea la única, la region también será borrada",
            },
        },
        canvas: {
            removeAllRegions: {
                title: "Borrar Regiones",
                confirmation: "¿Está seguro de que quiere borrar todas las regiones?",
            },
            canvasCommandBar: {
                items: {
                    layers: {
                        text: "Capas",
                        subMenuItems: {
                            text: "Texto",
                            tables: "Tablas",
                            selectionMarks: "Marcas de selección",
                            drawnRegions: "Regiones dibujadas",
                            labels: "Etiquetas"
                        },
                    },
                    drawRegion: "Dibujar regiones",
                },
                farItems: {
                    rotate: {
                        clockwise: "Girar la imagen 90 ° en el sentido de las agujas del reloj",
                        counterClockwise: "Girar la imagen 90 ° en sentido antihorario",
                    },
                    zoom: {
                        zoomOut: "Alejar",
                        zoomIn: "Acercar",
                    },
                    additionalActions: {
                        text: "Acciones adicionales",
                        subIMenuItems: {
                            runOcrOnCurrentDocument: "Ejecutar Layout en el documento actual",
                            runOcrOnAllDocuments: "Ejecute Layout en todos los documentos",
                            runAutoLabelingCurrentDocument: "Etiquetar automáticamente el documento actual",
                            runAutoLabelingOnMultipleUnlabeledDocuments: "Etiquetar automáticamente varios documentos sin etiquetar",
                            noPredictModelOnProject: "Predecir modelo no disponible, entrene el modelo primero.",
                            costWarningMessage: "Esta función generará el uso de su cuenta para análisis personalizados.",
                        }
                    }
                },
                warings: {
                    drawRegionUnsupportedAPIVersion: "Las regiones de dibujo no son compatibles con la versión de API ${apiVersion}. Será compatible con el lanzamiento de v2.1",
                }
            }
        },
        messages: {
            enforceTaggedRegions: {
                title: "Las regiones no válidas detectadas",
                description: "1 o más regiones no se han etiquetado.  \
                    Por favor, etiquete todas las regiones antes de continuar con el siguiente activo.",
            },
        },
        warningMessage: {
            PreventLeavingWhileRunningOCR: "Una operación de diseño está actualmente en curso, ¿está seguro de que desea salir?",
            PreventLeavingRunningAutoLabeling: "El etiquetado automático está actualmente en curso, ¿está seguro de que desea irse?",
        }
    },
    profile: {
        settings: "Configuración de Perfíl",
    },
    shortcuts: {
        squareBrackets: {
            keys: {
                leftBracket: "[",
                rightBracket: "]",
            },
            description: {
                prevWord: "Mover la selección a la palabra anterior",
                nextWord: "Mover la selección a la siguiente palabra",
            },
        },
        greaterAndLessThan: {
            keys: {
                lessThan: "<",
                greaterThan: ">",
            },
            description: {
                prevPage: "Ir a la página anterior en documentos de varias páginas",
                nextPage: "Ir a la página siguiente en documentos de varias páginas",
            },
        },
        zoomKeys: {
            keys: {
                minus: "-",
                plus: "=",
                slash: "/",
            },
            description: {
                in: "Aumentar el zoom",
                out: "Disminuir el zoom",
                reset: "Restablecer zoom",
            },
        },
        deleteAndBackspace: {
            keys: {
                delete: "Suprimir",
                backSpace: "Retroceso",
            },
            description: {
                delete: "Eliminar selección del mapa del documento o clave de selección de una etiqueta",
                backSpace: "Eliminar selección del mapa del documento o clave de selección de una etiqueta",
            },
        },
        drawnRegions: {
            keys: {
                escape: "Escape",
                alt: "Alt",
                backSpace: "Retroceso",
            },
            description: {
                deleteSelectedDrawnRegions: "Eliminar regiones dibujadas seleccionadas",
                cancelDrawOrReshape: "Cancelar la modificación o remodelación de regiones",
            }
        },
        tips: {
            quickLabeling: {
                name: "Etiquetado rápido",
                description: "Las teclas de acceso rápido de 1 a 0 y todas las letras se asignan a las primeras 36 etiquetas, después de seleccionar una o varias palabras de los elementos de texto resaltados, al presionar estas teclas de acceso rápido, puede etiquetar las palabras seleccionadas.",
            },
            renameTag: {
                name: "Renombrar Etiqueta",
                description: "Mantenga presionada la tecla Alt y haga clic en el nombre de la etiqueta, el usuario puede cambiar el nombre de la etiqueta.",
            },
            multipleWordSelection: {
                name: "Seleccione varias palabras pasando el cursor con el puntero",
                description: "Haga clic y mantenga presionada una palabra. Luego, coloca el cursor sobre palabras adicionales con el puntero.",
            },
            deleteAllLabelsForTag: {
                name: "Eliminar información asociada a una etiqueta",
                description: "Seleccione todas las etiquetas para una etiqueta en el documento y presione la tecla 'delete'"
            },
            groupSelect: {
                name: "Seleccione varias palabras dibujando un cuadro delimitador alrededor de las palabras incluidas",
                description: "Mantenga presionada la tecla Mayús. Luego, haga clic y mantenga presionado el botón izquierdo del ratón. Luego, arrastre el puntero para dibujar el cuadro delimitador alrededor de las palabras incluidas"
            }
        },
        headers: {
            keyboardShortcuts: "Atajos de teclado",
            otherTips: "Otros consejos",
        },
        iconTitle: "Atajos de teclado y consejos útiles"
    },
    errors: {
        unknown: {
            title: "Error desconocido",
            message: "La aplicación encontró un error desconocido. Por favor inténtelo de nuevo.",
        },
        projectUploadError: {
            title: "Error al cargar el archivo",
            message: `Se ha encontrado un error al cargar el archivo.
                Compruebe que el archivo es del tipo correcto e inténtelo de nuevo.`,
        },
        genericRenderError: {
            title: "Error desconocido",
            message: "La aplicación encontró un error desconocido.  Por favor inténtelo de nuevo.",
        },
        projectInvalidSecurityToken: {
            title: "Error al cargar el archivo de proyecto",
            message: "Asegúrese de que el token de seguridad del proyecto existe.",
        },
        projectInvalidJson: {
            title: "Error al analizar el archivo de proyecto",
            message: "El archivo de proyecto no es un JSON válido.",
        },
        projectDeleteError: {
            title: "Error al eliminar el proyecto",
            message: `Se ha producido un error al eliminar el proyecto.
                Validar el archivo de proyecto y el token de seguridad existen e inténtelo de nuevo.`,
        },
        projectDeleteErrorSecurityTokenNotFound: {
            title: 'No se encontró el token de seguridad al eliminar el proyecto',
            message: "Token de seguridad no encontrado. El proyecto [$ {project.name}] se ha eliminado de la herramienta FoTT."
        },
        projectNotFound: {
            title: "Error en la carga del proyecto",
            message: "No podemos encontrar el fichero de proyecto ${file} en el blob container de destino ${container}.\
            El fichero de proyecto puede haber sido eliminado del contenedor, \
            o la configuración de la conexión asociada a este proyecto puede haber cambiado a un nuevo contenedor, donde este proyecto no existe.",
        },
        securityTokenNotFound: {
            title: "Error al cargar el archivo del proyecto",
            message: `El token de seguridad al que hace referencia el proyecto no se encuentra en la
                configuración de la aplicación actual. Compruebe que existe el token de seguridad e intente
                volver a cargar el proyecto.`,
        },
        canvasError: {
            title: "Error al cargar el lienzo",
            message: `Se produjo un error al cargar el lienzo, verifique los recursos del
                proyecto y vuelva a intentarlo.`,
        },
        importError: {
            title: "Error al importar el proyecto V1",
            message: "Hubo un error al importar el proyecto V1. Revisa el archivo del proyecto y vuelve a intentarlo",
        },
        pasteRegionTooBigError: {
            title: "Error al pegar region al activo",
            message: "Hubo un error al pagar el region al activo. Intenta copiar otra region",
        },
        exportFormatNotFound: {
            title: "Error exportando proyecto",
            message: `Proyecto falta el formato de exportación. Seleccione un formato de exportación en la página
            de configuración de exportación.`,
        },
        activeLearningPredictionError: {
            title: "Error de aprendizaje",
            message: "Se ha producido un error al predecir regiones en el activo actual. \
                Compruebe la configuración de aprendizaje activa y vuelva a intentarlo",
        },
        blobContainerIONotFound: {
            title: "No se encuentra el contenedor/blob",
            message: "Compruebe si el contenedor/blob existe en la cuenta de almacenamiento.",
        },
        blobContainerIOForbidden: {
            title: "No puede acceder al contenedor/blob",
            message: "Verifique si dispone de permisos de leer/escribir/listar/borrar para el contenedor/blob.",
        },
        projectDeleteForbidden: {
            title: "Error eliminando proyecto",
            message: "No puedo eliminar ${file} de su contenedor de blobs del almacenamiento de Azure, debido a la falta de permiso de borrado en el SAS URI.",
        },
        projectDeleteNotFound: {
            title: "Error eliminando proyecto",
            message: "No puedo encontrar ${file} en su contenedor de blobs del almacenamiento de Azure. Por favor, verfique si ya ha sido eliminado.",
        },
        predictWithoutTrainForbidden: {
            title: "Error de Predicción",
            message: "No podemos encontrar un modelo entrenado. Por favor, vaya a la sección \"Train\" y verifique que haya un modelo entrenado.",
        },
        missingRequiredFieldInLabelFile: {
            title: "Error cargando fichero de etiquetas",
            message: "Visualización de etiquetas desactivada. Verifique que tanto los campos 'documento' como 'etiquetas' existen y no está en blanco en el fichero de etiquetas ${labelFileName}.",
        },
        noLabelInLabelFile: {
            title: "Error cargando fichero de etiquetas",
            message: "Visualización de etiquetas desactivada. No hay etiquetas en el fichero de etiquetas ${labelFileName}. Este fichero de etiquetas no puede ser usado para entrenar. Considere añadir etiquetas a este fichero.",
        },
        duplicateFieldKeyInLabelsFile: {
            title: "Error cargando fichero de etiquetas",
            message: "Visualización de etiquetas desactivada. Hay nombres de etiquetas duplicados en ${labelFileName}. Por favor, corrija su fichero de etiquetas en el almacenamiento de Azure y verifique que todos los nombres son únicos cuando se eliminen espacios y se conviertan a minúsculas.",
        },
        invalidJSONFormat: {
            title: "Error cargando fichero de etiquetas",
            message: "Visualización de etiquetas desactivada. Formato JSON incorrecto en el fichero ${labelFileName}. Por favor, corrija su fichero de etiquetas en el almacenamiento de Azure.",
        },
        sameLabelInDifferentPageError: {
            title: "Error cargando fichero de etiquetas",
            message: "Visualización de etiquetas desactivada. La etiqueta ${tagName} se encuentra en más de una página, cada etiqueta debe aplicarse solo en el misma página. Por favor, corrija su fichero de etiquetas en el almacenamiento de Azure.",
        },
        duplicateBoxInLabelFile: {
            title: "Error cargando fichero de etiquetas",
            message: "Visualización de etiquetas desactivada. Hay cajas de duplicadas en la página ${page}. Por favor, corrija su fichero de etiquetas en el almacenamiento de Azure.",
        },
        endpointConnectionError: {
            title: "Error en la conexión a la API",
            message: "No se puede conectar al API en la dirección ${endpoint}. Por favor, verifique la calidad de su conexión y que la dirección de la API es correcta.",
        },
        tooManyRequests: {
            title: "Demasiadas solicitudes",
            message: "Se han realizado demasiadas conexiones en un corto periodo de tiempo. Por favor, inténtelo de nuevo.",
        },
        modelCountLimitExceeded: {
            title: "Demasiados modelos",
            message: "El número de modelos asociados con la API indicada, ha superado el límite permitido.",
        },
        requestSendError: {
            title: "solicitud enviar error",
            message: "Error al enviar solicitud a Azure Blob Container. Problemas comunes: \n • SAS URI no válida \n • Cross-Origin Resource Sharing (CORS) no está configurado del lado del servidor \n • Error de red",
        },
        modelNotFound: {
            title: "Modelo no encontrado",
            message: "Modelo \"${modelID}\" no encontrado. Por favor use otro modelo.",
        },
        connectionNotExistError: {
            title: "La conexión no existe",
            message: "La conexión no existe."
        },
        getOcrError: {
            title: "No se puede cargar el archivo OCR",
            message: "Error al cargar desde el archivo OCR. Verifique su conexión o configuración de red."
        }

    },
    shareProject: {
        name: "Compartir proyecto",
        errors: {
            cannotDecodeString: "No se puede decodificar el token compartido. Compruebe si se ha modificado el token compartido.",
            connectionNotFound: "Conexión no encontrada. Agregue la conexión del proyecto compartido a sus conexiones.",
            connectionRequirement: "La conexión del proyecto compartido debe agregarse antes de abrirlo",
            tokenNameExist: "¡Advertencia! Ya tiene token con el mismo nombre que en el proyecto compartido. Cree un nuevo token y actualice el proyecto existente que usa ''${sharedTokenName}'' con el nuevo nombre del token.",
        },
        copy: {
            success: "Token de proyecto copiado al portapapeles y listo para compartir. El receptor del token del proyecto puede hacer clic en 'Abrir proyecto en la nube' desde la página de inicio para usar el token compartido.",
        }
    },
    appSurveyText: "Ayúdenos a mejorar Form Recognizer. ¡Responda nuestra encuesta!"
};

/*eslint-enable no-template-curly-in-string, no-multi-str*/
